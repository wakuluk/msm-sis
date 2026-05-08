package com.msm.sis.api.dto.program;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RequirementDetailResponse(
        Long requirementId,
        String code,
        String name,
        String requirementType,
        String description,
        BigDecimal minimumCredits,
        Integer minimumCourses,
        String courseMatchMode,
        String minimumGrade,
        List<RequirementCourseResponse> requirementCourses,
        List<RequirementCourseRuleResponse> requirementCourseRules,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
