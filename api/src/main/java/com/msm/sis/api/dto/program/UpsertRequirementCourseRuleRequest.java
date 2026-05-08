package com.msm.sis.api.dto.program;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpsertRequirementCourseRuleRequest(
        @NotNull
        @Positive
        Long departmentId,

        @PositiveOrZero
        Integer minimumCourseNumber,

        @PositiveOrZero
        Integer maximumCourseNumber,

        @DecimalMin("0.00")
        BigDecimal minimumCredits,

        @PositiveOrZero
        Integer minimumCourses,

        @Size(max = 10)
        String minimumGrade
) {
}
