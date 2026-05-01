package com.msm.sis.api.dto.program;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpsertRequirementCourseRequest(
        @NotNull
        @Positive
        Long courseId,

        @Size(max = 10)
        String minimumGrade
) {
}
