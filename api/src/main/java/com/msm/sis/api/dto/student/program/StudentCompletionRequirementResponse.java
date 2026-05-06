package com.msm.sis.api.dto.student.program;

import java.math.BigDecimal;
import java.util.List;

public record StudentCompletionRequirementResponse(
        Long programVersionRequirementId,
        Long requirementId,
        String requirementCode,
        String requirementName,
        String requirementType,
        String requirementDescription,
        BigDecimal completed,
        BigDecimal planned,
        BigDecimal required,
        String progressUnit,
        BigDecimal minimumCredits,
        Integer minimumCourses,
        String courseMatchMode,
        String minimumGrade,
        boolean requiredInProgram,
        Integer sortOrder,
        String courseReusePolicy,
        String notes,
        List<String> rules,
        List<StudentRequirementCourseRuleResponse> courseRules,
        List<StudentRequirementMatchedCourseResponse> matchedCourses,
        List<StudentRequirementCourseResponse> courses
) {
}
