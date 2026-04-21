package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.CreateAcademicSubjectRequest;
import com.msm.sis.api.dto.academic.PatchAcademicDepartmentRequest;
import com.msm.sis.api.dto.academic.AcademicDepartmentResponse;
import com.msm.sis.api.dto.course.CourseResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.mapper.AcademicDepartmentMapper;
import com.msm.sis.api.patch.PatchValue;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicSubjectRepository;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.CourseVersionRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicDepartmentService {

    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicSubjectRepository academicSubjectRepository;
    private final AcademicDepartmentValidationService academicDepartmentValidationService;
    private final AcademicDepartmentMapper academicDepartmentMapper;
    private final CourseRepository courseRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final CourseMapper courseMapper;

    public AcademicDepartmentService(
            AcademicDepartmentRepository academicDepartmentRepository,
            AcademicSubjectRepository academicSubjectRepository,
            AcademicDepartmentValidationService academicDepartmentValidationService,
            AcademicDepartmentMapper academicDepartmentMapper,
            CourseRepository courseRepository,
            CourseVersionRepository courseVersionRepository,
            CourseMapper courseMapper
    ) {
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.academicSubjectRepository = academicSubjectRepository;
        this.academicDepartmentValidationService = academicDepartmentValidationService;
        this.academicDepartmentMapper = academicDepartmentMapper;
        this.courseRepository = courseRepository;
        this.courseVersionRepository = courseVersionRepository;
        this.courseMapper = courseMapper;
    }

    @Transactional(readOnly = true)
    public List<AcademicDepartmentResponse> searchAcademicDepartments(
            String sortBy,
            String sortDirection
    ) {
        return academicDepartmentRepository.findAll(buildSearchSort(sortBy, sortDirection)).stream()
                .map(academicDepartmentMapper::toAcademicDepartmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AcademicDepartmentResponse getAcademicDepartment(Long departmentId) {
        return getAcademicDepartment(departmentId, "code", "asc");
    }

    @Transactional(readOnly = true)
    public AcademicDepartmentResponse getAcademicDepartment(
            Long departmentId,
            String subjectSortBy,
            String subjectSortDirection
    ) {
        AcademicDepartment academicDepartment = getAcademicDepartmentEntity(departmentId);

        return academicDepartmentMapper.toAcademicDepartmentResponse(
                academicDepartment,
                academicSubjectRepository.findAllByDepartment_Id(
                        departmentId,
                        buildAcademicSubjectSort(subjectSortBy, subjectSortDirection)
                )
        );
    }

    @Transactional
    public AcademicDepartmentResponse patchAcademicDepartment(
            Long departmentId,
            PatchAcademicDepartmentRequest request
    ) {
        AcademicDepartment existingAcademicDepartment = getAcademicDepartmentEntity(departmentId);
        AcademicDepartment candidateAcademicDepartment = copyAcademicDepartment(existingAcademicDepartment);

        applyPatch(candidateAcademicDepartment, request);
        academicDepartmentValidationService.validatePatchAcademicDepartment(
                existingAcademicDepartment,
                candidateAcademicDepartment
        );

        if (!hasPatchableChanges(existingAcademicDepartment, candidateAcademicDepartment)) {
            return getAcademicDepartment(departmentId);
        }

        copyPatchableFields(candidateAcademicDepartment, existingAcademicDepartment);
        academicDepartmentRepository.save(existingAcademicDepartment);
        return getAcademicDepartment(departmentId);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getDepartmentSubjectCourses(Long departmentId, Long subjectId) {
        AcademicDepartment academicDepartment = getAcademicDepartmentEntity(departmentId);

        if (subjectId == null || subjectId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject ID must be greater than zero.");
        }

        academicSubjectRepository.findByIdAndDepartment_Id(subjectId, academicDepartment.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<com.msm.sis.api.entity.Course> courses = courseRepository.findAllBySubject_IdAndSubject_Department_Id(
                subjectId,
                academicDepartment.getId(),
                Sort.by(Sort.Direction.ASC, "courseNumber")
                        .and(Sort.by(Sort.Direction.ASC, "id"))
        );

        Map<Long, String> currentVersionTitlesByCourseId = buildCurrentVersionTitlesByCourseId(courses);

        return courses.stream()
                .map(course -> courseMapper.toCourseResponse(
                        course,
                        currentVersionTitlesByCourseId.get(course.getId())
                ))
                .toList();
    }

    private Map<Long, String> buildCurrentVersionTitlesByCourseId(List<Course> courses) {
        List<Long> courseIds = courses.stream()
                .map(Course::getId)
                .filter(Objects::nonNull)
                .toList();

        if (courseIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, String> titlesByCourseId = new LinkedHashMap<>();
        courseVersionRepository.findCurrentCourseVersionsByCourseIds(courseIds)
                .forEach(courseVersion -> {
                    if (courseVersion.getCourse() == null || courseVersion.getCourse().getId() == null) {
                        return;
                    }

                    titlesByCourseId.put(courseVersion.getCourse().getId(), courseVersion.getTitle());
                });

        return titlesByCourseId;
    }

    @Transactional
    public AcademicDepartmentResponse createAcademicSubject(
            Long departmentId,
            CreateAcademicSubjectRequest request
    ) {
        AcademicDepartment academicDepartment = getAcademicDepartmentEntity(departmentId);

        String candidateCode = trimToNull(request.code());
        String candidateName = trimToNull(request.name());

        academicDepartmentValidationService.validateCreateAcademicSubject(candidateCode, candidateName);

        AcademicSubject academicSubject = new AcademicSubject();
        academicSubject.setDepartment(academicDepartment);
        academicSubject.setCode(candidateCode);
        academicSubject.setName(candidateName);
        academicSubject.setActive(true);

        academicSubjectRepository.save(academicSubject);
        return getAcademicDepartment(departmentId);
    }

    private AcademicDepartment getAcademicDepartmentEntity(Long departmentId) {
        return academicDepartmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private Sort buildSearchSort(String sortBy, String sortDirection) {
        String sortProperty = switch (sortBy == null ? "name" : sortBy.trim()) {
            case "code" -> "code";
            case "name" -> "name";
            case "active" -> "active";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: code, name, active."
            );
        };

        return Sort.by(parseSortDirection(sortDirection), sortProperty)
                .and(Sort.by(Sort.Direction.ASC, "name"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Sort buildAcademicSubjectSort(String sortBy, String sortDirection) {
        String sortProperty = switch (sortBy == null ? "code" : sortBy.trim()) {
            case "code" -> "code";
            case "name" -> "name";
            case "active" -> "active";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: code, name, active."
            );
        };

        return Sort.by(parseSortDirection(sortDirection), sortProperty)
                .and(Sort.by(Sort.Direction.ASC, "code"))
                .and(Sort.by(Sort.Direction.ASC, "name"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        try {
            return Sort.Direction.fromString(sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

    private AcademicDepartment copyAcademicDepartment(AcademicDepartment academicDepartment) {
        AcademicDepartment copy = new AcademicDepartment();
        copy.setId(academicDepartment.getId());
        copy.setCode(academicDepartment.getCode());
        copy.setName(academicDepartment.getName());
        copy.setActive(academicDepartment.isActive());
        return copy;
    }

    private void copyPatchableFields(AcademicDepartment source, AcademicDepartment target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setActive(source.isActive());
    }

    private void applyPatch(AcademicDepartment academicDepartment, PatchAcademicDepartmentRequest request) {
        applyTrimmed(request.getCode(), academicDepartment::setCode);
        applyTrimmed(request.getName(), academicDepartment::setName);
        applyRequiredBoolean(request.getActive(), academicDepartment::setActive, "Academic department active flag");
    }

    private boolean hasPatchableChanges(AcademicDepartment existing, AcademicDepartment candidate) {
        return !Objects.equals(trimToNull(existing.getCode()), trimToNull(candidate.getCode()))
                || !Objects.equals(trimToNull(existing.getName()), trimToNull(candidate.getName()))
                || existing.isActive() != candidate.isActive();
    }

    private void applyTrimmed(PatchValue<String> value, Consumer<String> consumer) {
        if (value.isPresent()) {
            consumer.accept(trimToNull(value.orElse(null)));
        }
    }

    private void applyRequiredBoolean(
            PatchValue<Boolean> value,
            Consumer<Boolean> consumer,
            String fieldName
    ) {
        if (!value.isPresent()) {
            return;
        }

        Boolean patchedValue = value.orElse(null);
        if (patchedValue == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }

        consumer.accept(patchedValue);
    }

}
