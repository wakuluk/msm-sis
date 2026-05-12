package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupExistingAssignmentResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupStudentOptionResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupStudentOptionsResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class RegistrationGroupStudentOptionService {
    private static final int MAX_SIZE = 25;
    private static final Pattern DIGITS_ONLY = Pattern.compile("\\d+");

    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public RegistrationGroupStudentOptionsResponse searchStudentOptions(
            String search,
            Long academicYearId,
            Long termId,
            int size
    ) {
        validatePageRequest(0, size, MAX_SIZE);

        String normalizedSearch = trimToNull(search);
        if (shouldSkipSearch(normalizedSearch)) {
            return new RegistrationGroupStudentOptionsResponse(List.of());
        }

        List<StudentRepository.RegistrationGroupStudentOptionProjection> results = studentRepository
                .findRegistrationGroupStudentOptions(
                        normalizedSearch,
                        size
                )
                .stream()
                .toList();
        Map<Long, RegistrationGroupStudent> assignmentsByStudentId =
                loadExistingAssignmentsByStudentId(results, academicYearId, termId);

        return new RegistrationGroupStudentOptionsResponse(results.stream()
                .map(projection -> toResponse(projection, assignmentsByStudentId.get(projection.getStudentId())))
                .toList());
    }

    private boolean shouldSkipSearch(String search) {
        if (search == null) {
            return true;
        }

        return search.length() < 2 && !DIGITS_ONLY.matcher(search).matches();
    }

    private RegistrationGroupStudentOptionResponse toResponse(
            StudentRepository.RegistrationGroupStudentOptionProjection projection,
            RegistrationGroupStudent existingAssignment
    ) {
        return new RegistrationGroupStudentOptionResponse(
                projection.getStudentId(),
                projection.getStudentNumber(),
                projection.getFirstName(),
                projection.getLastName(),
                buildDisplayName(projection),
                projection.getEmail(),
                projection.getClassStanding(),
                projection.getClassOf(),
                toExistingAssignmentResponse(existingAssignment)
        );
    }

    private Map<Long, RegistrationGroupStudent> loadExistingAssignmentsByStudentId(
            List<StudentRepository.RegistrationGroupStudentOptionProjection> results,
            Long academicYearId,
            Long termId
    ) {
        if (results.isEmpty() || academicYearId == null || termId == null) {
            return Map.of();
        }

        List<Long> studentIds = results.stream()
                .map(StudentRepository.RegistrationGroupStudentOptionProjection::getStudentId)
                .toList();

        return registrationGroupStudentRepository.findAssignmentsForStudentsInPeriod(
                        studentIds,
                        requirePositiveId(academicYearId, "Academic year id"),
                        requirePositiveId(termId, "Term id")
                )
                .stream()
                .collect(Collectors.toMap(
                        assignment -> assignment.getStudent().getId(),
                        Function.identity(),
                        (first, second) -> first
                ));
    }

    private RegistrationGroupExistingAssignmentResponse toExistingAssignmentResponse(
            RegistrationGroupStudent registrationGroupStudent
    ) {
        if (registrationGroupStudent == null) {
            return null;
        }

        RegistrationGroup registrationGroup = registrationGroupStudent.getRegistrationGroup();
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        String statusCode = normalizeStatusCode(registrationGroup.getStatus());

        return new RegistrationGroupExistingAssignmentResponse(
                registrationGroup.getId(),
                registrationGroup.getName(),
                statusCode,
                toStatusName(statusCode),
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                term.getId(),
                term.getCode(),
                term.getName()
        );
    }

    private String normalizeStatusCode(String status) {
        String normalizedStatus = trimToNull(status);
        return normalizedStatus == null ? "DRAFT" : normalizedStatus.toUpperCase(Locale.ROOT);
    }

    private String toStatusName(String statusCode) {
        return RegistrationGroupStatusSupport.statusName(statusCode);
    }

    private String buildDisplayName(StudentRepository.RegistrationGroupStudentOptionProjection projection) {
        String firstName = projection.getFirstName() == null ? "" : projection.getFirstName().trim();
        String lastName = projection.getLastName() == null ? "" : projection.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        if (!displayName.isBlank()) {
            return displayName;
        }

        String email = trimToNull(projection.getEmail());
        if (email != null) {
            return email;
        }

        String studentNumber = trimToNull(projection.getStudentNumber());
        return studentNumber == null ? String.valueOf(projection.getStudentId()) : studentNumber;
    }
}
