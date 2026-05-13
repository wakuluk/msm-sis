package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record CreateCourseVersionRequisiteCourseRequest(
        @NotNull
        @Positive
        Long courseId,

        @Pattern(regexp = "A|A-|B\\+|B|B-|C\\+|C|C-|D\\+|D|D-")
        String minimumGrade,

        @PositiveOrZero
        Integer sortOrder
) {
}
