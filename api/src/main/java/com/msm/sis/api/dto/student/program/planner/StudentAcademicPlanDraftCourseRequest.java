package com.msm.sis.api.dto.student.program.planner;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record StudentAcademicPlanDraftCourseRequest(
        Long studentAcademicPlanCourseId,

        Long courseId,

        Long studentProgramId,
        Long requirementId,

        @DecimalMin(value = "0.00")
        @Digits(integer = 2, fraction = 2)
        BigDecimal credits,

        @Size(max = 30)
        String plannerBucketCode,

        @Size(max = 100)
        String plannerBucketLabel,

        @Size(max = 40)
        String placeholderType,

        @Size(max = 120)
        String placeholderLabel,

        @Size(max = 20)
        String placeholderSubjectCode,

        Long placeholderDepartmentId,

        @PositiveOrZero
        Integer placeholderMinimumCourseNumber,

        @PositiveOrZero
        Integer placeholderMaximumCourseNumber,

        @NotNull
        @PositiveOrZero
        Integer sortOrder,

        @Size(max = 500)
        String notes
) {
}
