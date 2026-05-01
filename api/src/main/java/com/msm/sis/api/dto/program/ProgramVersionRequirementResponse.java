package com.msm.sis.api.dto.program;

import java.math.BigDecimal;
import java.util.List;

public record ProgramVersionRequirementResponse(
        Long programVersionRequirementId,
        Long requirementId,
        String requirementCode,
        String requirementName,
        String requirementType,
        String requirementDescription,
        BigDecimal minimumCredits,
        Integer minimumCourses,
        String courseMatchMode,
        String minimumGrade,
        List<RequirementCourseResponse> requirementCourses,
        List<RequirementCourseRuleResponse> requirementCourseRules,
        Integer sortOrder,
        boolean required,
        String notes
) {
}
