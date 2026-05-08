package com.msm.sis.api.dto.student.program;

import java.math.BigDecimal;

public record StudentRequirementCourseRuleResponse(
        Long requirementCourseRuleId,
        Long departmentId,
        String departmentCode,
        Integer minimumCourseNumber,
        Integer maximumCourseNumber,
        BigDecimal minimumCredits,
        Integer minimumCourses,
        String minimumGrade
) {
}
