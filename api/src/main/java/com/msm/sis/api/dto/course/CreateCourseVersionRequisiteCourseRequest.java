package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record CreateCourseVersionRequisiteCourseRequest(
        @NotNull
        @Positive
        Long courseId,

        @PositiveOrZero
        Integer sortOrder
) {
}
