package com.msm.sis.api.service;

import com.msm.sis.api.dto.CreateStudentRequest;
import com.msm.sis.api.dto.PatchStudentRequest;
import com.msm.sis.api.dto.StudentSearchCriteria;
import com.msm.sis.api.dto.StudentSearchResponse;
import com.msm.sis.api.dto.StudentDetailResponse;
import com.msm.sis.api.dto.StudentProfileResponse;
import com.msm.sis.api.entity.Address;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.mapper.StudentMapper;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.validation.StudentValidator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

import static com.msm.sis.api.util.TextUtils.trimToNull;

/**
 * Orchestrates student reads and writes while delegating field-level mapping
 * and address resolution to dedicated collaborators.
 */
@Service
public class StudentService {

    private final AddressService addressService;
    private final StudentRepository studentRepository;
    private final StudentMapper studentMapper;
    private final StudentValidator studentValidator;

    public StudentService(
            AddressService addressService,
            StudentRepository studentRepository,
            StudentMapper studentMapper,
            StudentValidator studentValidator
    ) {
        this.addressService = addressService;
        this.studentRepository = studentRepository;
        this.studentMapper = studentMapper;
        this.studentValidator = studentValidator;
    }

    /**
     * Loads the internal student detail view used by staff/admin-style pages.
     */
    public StudentDetailResponse getStudentById(Long studentId) {
        Student student = studentRepository.findByIdWithDetails(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return studentMapper.toStudentDetailResponse(student);
    }

    /**
     * Loads the self-service student profile tied to the authenticated user account.
     */
    public StudentProfileResponse getStudentProfile(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return studentMapper.toStudentProfileResponse(student);
    }

    /**
     * Creates a new student record from the incoming request after mapper-level validation.
     */
    @Transactional
    public StudentDetailResponse createStudent(CreateStudentRequest request, String updatedBy) {
        Student student = studentMapper.fromCreateRequest(request);
        studentValidator.validate(student);

        Address resolvedAddress = addressService.resolveAddress(request, updatedBy);
        student.setAddress(resolvedAddress);
        student.setAddressId(resolvedAddress == null ? null : resolvedAddress.getId());
        student.setUpdatedBy(updatedBy);

        Student savedStudent = studentRepository.save(student);
        Student savedStudentWithDetails = studentRepository.findByIdWithDetails(savedStudent.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return studentMapper.toStudentDetailResponse(savedStudentWithDetails);
    }

    /**
     * Applies only the fields included in the patch request. Address fields are
     * resolved through AddressService so shared address rows are reused instead
     * of mutated in place.
     */
    @Transactional
    public StudentDetailResponse patchStudent(Long studentId, PatchStudentRequest request, String updatedBy) {
        Student student = studentRepository.findByIdWithDetails(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // Apply only the fields that were included in the PATCH body.
        studentMapper.applyPatch(student, request);
        studentValidator.validate(student);

        if (addressService.hasAddressChanges(request)) {
            // Address updates are resolved to a reusable address row instead of mutating
            // the current row in place, which avoids changing another student by accident.
            Address resolvedAddress = addressService.resolveAddress(student.getAddress(), request, updatedBy);
            student.setAddress(resolvedAddress);
            student.setAddressId(resolvedAddress == null ? null : resolvedAddress.getId());
        }

        student.setUpdatedBy(updatedBy);
        Student savedStudent = studentRepository.save(student);
        return studentMapper.toStudentDetailResponse(savedStudent);
    }

    /**
     * Supports the admin search form with optional filters and paged results.
     * Omitting every filter returns the full student list one page at a time.
     */
    public StudentSearchResponse searchStudents(
            StudentSearchCriteria criteria,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                buildSearchSort(sortBy, sortDirection)
        );

        Page<Student> studentsPage = studentRepository.searchStudents(
                criteria.getStudentId(),
                trimToNull(criteria.getFirstName()),
                trimToNull(criteria.getLastName()),
                trimToNull(criteria.getUpdatedBy()),
                criteria.getClassOf(),
                trimToNull(criteria.getAddressLine1()),
                trimToNull(criteria.getAddressLine2()),
                trimToNull(criteria.getCity()),
                trimToNull(criteria.getStateRegion()),
                trimToNull(criteria.getPostalCode()),
                trimToNull(criteria.getCountryCode()),
                pageable
        );

        return studentMapper.toStudentSearchResponse(studentsPage);
    }

    private Sort buildSearchSort(String sortBy, String sortDirection) {
        Direction direction;

        try {
            direction = Direction.fromString(sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }

        String sortProperty = switch (trimToNull(sortBy) == null ? "lastName" : sortBy.trim()) {
            case "studentId" -> "id";
            case "firstName" -> "firstName";
            case "lastName" -> "lastName";
            case "classOf" -> "estimatedGradDate";
            case "classStanding" -> "classStanding.name";
            case "addressLine1" -> "address.addressLine1";
            case "addressLine2" -> "address.addressLine2";
            case "city" -> "address.city";
            case "stateRegion" -> "address.stateRegion";
            case "postalCode" -> "address.postalCode";
            case "countryCode" -> "address.countryCode";
            case "disabled" -> "disabled";
            case "lastUpdated" -> "lastUpdated";
            case "updatedBy" -> "updatedBy";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported sort field: " + sortBy
            );
        };

        Sort primarySort = Sort.by(direction, sortProperty);

        // Keep paging stable when many rows share the same visible sort value.
        return primarySort.and(Sort.by("id").ascending());
    }

}
