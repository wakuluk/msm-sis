package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Component
public class RequirementProgressMath {

    public BigDecimal requiredValue(Requirement requirement) {
        if (requirement == null) {
            return BigDecimal.ZERO;
        }

        if (requirement.getMinimumCredits() != null) {
            return requirement.getMinimumCredits();
        }

        if (requirement.getMinimumCourses() != null) {
            return BigDecimal.valueOf(requirement.getMinimumCourses());
        }

        return BigDecimal.ZERO;
    }

    public BigDecimal requiredValueForRequirementCourses(
            Requirement requirement,
            List<RequirementCourse> requirementCourses
    ) {
        BigDecimal required = requiredValue(requirement);
        if (required.compareTo(BigDecimal.ZERO) > 0) {
            return required;
        }

        return BigDecimal.valueOf(requirementCourses.stream()
                .filter(RequirementCourse::isRequired)
                .count());
    }

    public BigDecimal requiredValueForRequirementCourseRules(
            Requirement requirement,
            List<RequirementCourseRule> requirementCourseRules
    ) {
        BigDecimal required = requiredValue(requirement);
        if (required.compareTo(BigDecimal.ZERO) > 0) {
            return required;
        }

        return requirementCourseRules.stream()
                .map(rule -> rule.getMinimumCredits() == null
                        ? rule.getMinimumCourses() == null
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(rule.getMinimumCourses())
                        : rule.getMinimumCredits())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public String progressUnit(Requirement requirement) {
        return requirement != null && requirement.getMinimumCredits() != null ? "credits" : "courses";
    }

    public String progressUnit(
            Requirement requirement,
            List<RequirementCourseRule> requirementCourseRules
    ) {
        if (requirement != null && requirement.getMinimumCredits() != null) {
            return "credits";
        }

        return requirementCourseRules.stream().anyMatch(rule -> rule.getMinimumCredits() != null)
                ? "credits"
                : "courses";
    }

    public BigDecimal sumCompletedCredits(List<StudentCourseEvidence> evidence) {
        return evidence.stream()
                .map(StudentCourseEvidence::creditsEarned)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal sumPlannedCredits(List<StudentAcademicPlanCourse> plannedCourses) {
        return plannedCourses.stream()
                .map(StudentAcademicPlanCourse::getCredits)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal cap(BigDecimal value, BigDecimal maximum) {
        if (maximum == null || maximum.compareTo(BigDecimal.ZERO) <= 0) {
            return value == null ? BigDecimal.ZERO : value;
        }

        if (value == null) {
            return BigDecimal.ZERO;
        }

        return value.min(maximum).max(BigDecimal.ZERO);
    }
}
