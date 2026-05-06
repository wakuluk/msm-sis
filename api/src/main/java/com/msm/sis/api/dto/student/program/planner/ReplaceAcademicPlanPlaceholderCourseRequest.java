package com.msm.sis.api.dto.student.program.planner;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ReplaceAcademicPlanPlaceholderCourseRequest(
        @NotNull
        Long courseId,

        @DecimalMin(value = "0.00")
        @Digits(integer = 2, fraction = 2)
        BigDecimal credits
) {
}
