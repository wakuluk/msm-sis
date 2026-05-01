package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.CreateRequirementRequest;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRequest;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRuleRequest;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.repository.ProgramVersionRequirementRepository;
import com.msm.sis.api.repository.RequirementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class RequirementValidationService {
    private static final String TOTAL_ELECTIVE_CREDITS = "TOTAL_ELECTIVE_CREDITS";
    private static final String SPECIFIC_COURSES = "SPECIFIC_COURSES";
    private static final String DEPARTMENT_LEVEL_COURSES = "DEPARTMENT_LEVEL_COURSES";
    private static final String MANUAL = "MANUAL";
    private static final String COURSE_MATCH_ALL = "ALL";
    private static final String COURSE_MATCH_ANY = "ANY";

    private final ProgramVersionRequirementRepository programVersionRequirementRepository;
    private final RequirementRepository requirementRepository;

    public void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }
    }

    public void validateCreateRequirementRequest(CreateRequirementRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        if (trimToNull(request.code()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement code is required.");
        }

        if (trimToNull(request.name()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement name is required.");
        }

        validateRequirementShape(
                request.requirementType(),
                request.minimumCredits(),
                request.minimumCourses(),
                request.courseMatchMode(),
                request.requirementCourses(),
                request.requirementCourseRules(),
                true
        );
    }

    public void validateRequirementCodeAvailable(String code) {
        if (requirementRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A requirement with this code already exists.");
        }
    }

    public void validateRequirementCodeAvailableForPatch(Requirement requirement, String code) {
        requirementRepository.findByCode(code)
                .filter(existingRequirement -> !Objects.equals(existingRequirement.getId(), requirement.getId()))
                .ifPresent(existingRequirement -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "A requirement with this code already exists."
                    );
                });
    }

    public void validateRequirementAssignmentAvailable(Long programVersionId, Long requirementId) {
        if (programVersionRequirementRepository.hasRequirement(programVersionId, requirementId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This requirement is already attached to the selected program version."
            );
        }
    }

    public void validateRequirementShape(
            String requirementType,
            BigDecimal minimumCredits,
            Integer minimumCourses,
            String courseMatchMode,
            List<UpsertRequirementCourseRequest> requirementCourses,
            List<UpsertRequirementCourseRuleRequest> requirementCourseRules,
            boolean requireChildRows
    ) {
        String normalizedRequirementType = trimToNull(requirementType);

        if (normalizedRequirementType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement type is required.");
        }

        switch (normalizedRequirementType) {
            case TOTAL_ELECTIVE_CREDITS -> validateTotalElectiveCredits(minimumCredits);
            case SPECIFIC_COURSES -> validateSpecificCourses(courseMatchMode, minimumCourses, requirementCourses, requireChildRows);
            case DEPARTMENT_LEVEL_COURSES -> validateDepartmentLevelCourses(requirementCourseRules, requireChildRows);
            case MANUAL -> {
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement type is invalid.");
        }
    }

    public void validateRequirementCourseRuleRange(
            Integer minimumCourseNumber,
            Integer maximumCourseNumber
    ) {
        if (minimumCourseNumber != null
                && maximumCourseNumber != null
                && maximumCourseNumber < minimumCourseNumber) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum course number must be greater than or equal to minimum course number."
            );
        }
    }

    private void validateTotalElectiveCredits(BigDecimal minimumCredits) {
        if (minimumCredits == null || minimumCredits.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Total elective credit requirements need minimum credits."
            );
        }
    }

    private void validateSpecificCourses(
            String courseMatchMode,
            Integer minimumCourses,
            List<UpsertRequirementCourseRequest> requirementCourses,
            boolean requireChildRows
    ) {
        String normalizedMatchMode = trimToNull(courseMatchMode);

        if (!COURSE_MATCH_ALL.equals(normalizedMatchMode) && !COURSE_MATCH_ANY.equals(normalizedMatchMode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Specific course requirements need course match mode ALL or ANY."
            );
        }

        if (COURSE_MATCH_ANY.equals(normalizedMatchMode) && (minimumCourses == null || minimumCourses <= 0)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Choose-from-list requirements need minimum courses."
            );
        }

        if (requireChildRows && (requirementCourses == null || requirementCourses.isEmpty())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Specific course requirements need at least one course."
            );
        }

        if (requirementCourses == null) {
            return;
        }

        Set<Long> courseIds = new HashSet<>();

        for (UpsertRequirementCourseRequest course : requirementCourses) {
            if (course.courseId() == null || course.courseId() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Specific course requirements need valid courses."
                );
            }

            if (!courseIds.add(course.courseId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Specific course requirements cannot include the same course more than once."
                );
            }
        }
    }

    private void validateDepartmentLevelCourses(
            List<UpsertRequirementCourseRuleRequest> requirementCourseRules,
            boolean requireChildRows
    ) {
        if (requireChildRows && (requirementCourseRules == null || requirementCourseRules.isEmpty())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Department course requirements need at least one course rule."
            );
        }

        if (requirementCourseRules == null) {
            return;
        }

        for (UpsertRequirementCourseRuleRequest rule : requirementCourseRules) {
            if (rule.departmentId() == null || rule.departmentId() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Department course rules need a department."
                );
            }

            boolean hasMinimumCredits = rule.minimumCredits() != null
                    && rule.minimumCredits().compareTo(BigDecimal.ZERO) > 0;
            boolean hasMinimumCourses = rule.minimumCourses() != null && rule.minimumCourses() > 0;

            if (!hasMinimumCredits && !hasMinimumCourses) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Department course rules need minimum credits or minimum courses."
                );
            }
        }
    }
}
