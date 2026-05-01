package com.msm.sis.api.dto.program;

import java.math.BigDecimal;

public record RequirementCourseRuleResponse(
        Long requirementCourseRuleId,
        Long departmentId,
        String departmentCode,
        String departmentName,
        Integer minimumCourseNumber,
        Integer maximumCourseNumber,
        BigDecimal minimumCredits,
        Integer minimumCourses,
        String minimumGrade
) {
}
