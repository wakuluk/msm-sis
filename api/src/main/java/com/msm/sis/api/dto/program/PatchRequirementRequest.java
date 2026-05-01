package com.msm.sis.api.dto.program;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record PatchRequirementRequest(
        @Size(max = 50)
        String code,

        @Size(max = 255)
        String name,

        @Size(max = 50)
        String requirementType,

        String description,

        @DecimalMin("0.00")
        BigDecimal minimumCredits,

        @PositiveOrZero
        Integer minimumCourses,

        @Size(max = 50)
        String courseMatchMode,

        @Size(max = 10)
        String minimumGrade,

        @Valid
        List<UpsertRequirementCourseRequest> requirementCourses,

        @Valid
        List<UpsertRequirementCourseRuleRequest> requirementCourseRules
) {
}
