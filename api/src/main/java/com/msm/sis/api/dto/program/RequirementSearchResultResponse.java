package com.msm.sis.api.dto.program;

import java.math.BigDecimal;

public record RequirementSearchResultResponse(
        Long requirementId,
        String code,
        String name,
        String requirementType,
        String description,
        BigDecimal minimumCredits,
        Integer minimumCourses,
        String courseMatchMode,
        String minimumGrade,
        int requirementCourseCount,
        int requirementCourseRuleCount
) {
}
