package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.UpsertRequirementCourseRequest;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRuleRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class RequirementShapeValidationService {
    private static final String TOTAL_ELECTIVE_CREDITS = "TOTAL_ELECTIVE_CREDITS";
    private static final String SPECIFIC_COURSES = "SPECIFIC_COURSES";
    private static final String DEPARTMENT_LEVEL_COURSES = "DEPARTMENT_LEVEL_COURSES";
    private static final String MANUAL = "MANUAL";
    private static final String COURSE_MATCH_ALL = "ALL";
    private static final String COURSE_MATCH_ANY = "ANY";

    public void validateRequirementShape(
            String requirementType,
            BigDecimal minimumCredits,
            Integer minimumCourses,
            String courseMatchMode,
            String minimumGrade,
            List<UpsertRequirementCourseRequest> requirementCourses,
            List<UpsertRequirementCourseRuleRequest> requirementCourseRules
    ) {
        String normalizedRequirementType = trimToNull(requirementType);

        if (normalizedRequirementType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement type is required.");
        }

        switch (normalizedRequirementType) {
            case TOTAL_ELECTIVE_CREDITS -> validateTotalElectiveCredits(
                    minimumCredits,
                    minimumCourses,
                    courseMatchMode,
                    minimumGrade,
                    requirementCourses,
                    requirementCourseRules
            );
            case SPECIFIC_COURSES -> validateSpecificCourses(
                    minimumCredits,
                    minimumCourses,
                    courseMatchMode,
                    minimumGrade,
                    requirementCourses,
                    requirementCourseRules
            );
            case DEPARTMENT_LEVEL_COURSES -> validateDepartmentLevelCourses(
                    minimumCredits,
                    minimumCourses,
                    courseMatchMode,
                    minimumGrade,
                    requirementCourses,
                    requirementCourseRules
            );
            case MANUAL -> validateManual(
                    minimumCredits,
                    minimumCourses,
                    courseMatchMode,
                    minimumGrade,
                    requirementCourses,
                    requirementCourseRules
            );
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

    private void validateTotalElectiveCredits(
            BigDecimal minimumCredits,
            Integer minimumCourses,
            String courseMatchMode,
            String minimumGrade,
            List<UpsertRequirementCourseRequest> requirementCourses,
            List<UpsertRequirementCourseRuleRequest> requirementCourseRules
    ) {
        if (minimumCredits == null || minimumCredits.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Total elective credit requirements need minimum credits."
            );
        }

        requireNoMinimumCourses(minimumCourses, "Total elective credit requirements cannot use minimum courses.");
        requireNoCourseMatchMode(courseMatchMode, "Total elective credit requirements cannot use course match mode.");
        requireNoMinimumGrade(minimumGrade, "Total elective credit requirements cannot use minimum grade.");
        requireNoCourses(requirementCourses, "Total elective credit requirements cannot include specific courses.");
        requireNoCourseRules(requirementCourseRules, "Total elective credit requirements cannot include course rules.");
    }

    private void validateSpecificCourses(
            BigDecimal minimumCredits,
            Integer minimumCourses,
            String courseMatchMode,
            String minimumGrade,
            List<UpsertRequirementCourseRequest> requirementCourses,
            List<UpsertRequirementCourseRuleRequest> requirementCourseRules
    ) {
        requireNoMinimumCredits(minimumCredits, "Specific course requirements cannot use minimum credits.");
        requireNoMinimumGrade(minimumGrade, "Specific course requirements cannot use requirement-level minimum grade.");
        requireNoCourseRules(requirementCourseRules, "Specific course requirements cannot include course rules.");

        String normalizedMatchMode = trimToNull(courseMatchMode);

        if (!COURSE_MATCH_ALL.equals(normalizedMatchMode) && !COURSE_MATCH_ANY.equals(normalizedMatchMode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Specific course requirements need course match mode ALL or ANY."
            );
        }

        if (requirementCourses == null || requirementCourses.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Specific course requirements need at least one course."
            );
        }

        if (COURSE_MATCH_ALL.equals(normalizedMatchMode)) {
            requireNoMinimumCourses(minimumCourses, "All-course requirements cannot use minimum courses.");
        }

        if (COURSE_MATCH_ANY.equals(normalizedMatchMode)) {
            if (minimumCourses == null || minimumCourses <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Choose-from-list requirements need minimum courses."
                );
            }

            if (minimumCourses > requirementCourses.size()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Choose-from-list minimum courses cannot exceed the number of selected courses."
                );
            }
        }

        validateSpecificCourseRows(requirementCourses);
    }

    private void validateDepartmentLevelCourses(
            BigDecimal minimumCredits,
            Integer minimumCourses,
            String courseMatchMode,
            String minimumGrade,
            List<UpsertRequirementCourseRequest> requirementCourses,
            List<UpsertRequirementCourseRuleRequest> requirementCourseRules
    ) {
        requireNoMinimumCredits(minimumCredits, "Department course requirements cannot use requirement-level credits.");
        requireNoMinimumCourses(minimumCourses, "Department course requirements cannot use requirement-level courses.");
        requireNoCourseMatchMode(courseMatchMode, "Department course requirements cannot use course match mode.");
        requireNoMinimumGrade(minimumGrade, "Department course requirements cannot use requirement-level minimum grade.");
        requireNoCourses(requirementCourses, "Department course requirements cannot include specific courses.");

        if (requirementCourseRules == null || requirementCourseRules.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Department course requirements need at least one course rule."
            );
        }

        for (UpsertRequirementCourseRuleRequest rule : requirementCourseRules) {
            validateDepartmentCourseRule(rule);
        }
    }

    private void validateManual(
            BigDecimal minimumCredits,
            Integer minimumCourses,
            String courseMatchMode,
            String minimumGrade,
            List<UpsertRequirementCourseRequest> requirementCourses,
            List<UpsertRequirementCourseRuleRequest> requirementCourseRules
    ) {
        requireNoMinimumCredits(minimumCredits, "Manual requirements cannot use minimum credits.");
        requireNoMinimumCourses(minimumCourses, "Manual requirements cannot use minimum courses.");
        requireNoCourseMatchMode(courseMatchMode, "Manual requirements cannot use course match mode.");
        requireNoMinimumGrade(minimumGrade, "Manual requirements cannot use minimum grade.");
        requireNoCourses(requirementCourses, "Manual requirements cannot include specific courses.");
        requireNoCourseRules(requirementCourseRules, "Manual requirements cannot include course rules.");
    }

    private void validateSpecificCourseRows(List<UpsertRequirementCourseRequest> requirementCourses) {
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

    private void validateDepartmentCourseRule(UpsertRequirementCourseRuleRequest rule) {
        if (rule.departmentId() == null || rule.departmentId() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Department course rules need a department."
            );
        }

        validateRequirementCourseRuleRange(rule.minimumCourseNumber(), rule.maximumCourseNumber());

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

    private void requireNoMinimumCredits(BigDecimal minimumCredits, String message) {
        if (minimumCredits != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void requireNoMinimumCourses(Integer minimumCourses, String message) {
        if (minimumCourses != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void requireNoCourseMatchMode(String courseMatchMode, String message) {
        if (trimToNull(courseMatchMode) != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void requireNoMinimumGrade(String minimumGrade, String message) {
        if (trimToNull(minimumGrade) != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void requireNoCourses(List<UpsertRequirementCourseRequest> requirementCourses, String message) {
        if (requirementCourses != null && !requirementCourses.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void requireNoCourseRules(List<UpsertRequirementCourseRuleRequest> requirementCourseRules, String message) {
        if (requirementCourseRules != null && !requirementCourseRules.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }
}
