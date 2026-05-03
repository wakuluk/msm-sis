package com.msm.sis.api.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateCourseVersionRequisiteGroupRequest(
        @NotBlank
        @Size(max = 20)
        String requisiteType,

        @NotBlank
        @Size(max = 20)
        String conditionType,

        @Positive
        Integer minimumRequired,

        @PositiveOrZero
        Integer sortOrder,

        @NotNull
        @Valid
        List<CreateCourseVersionRequisiteCourseRequest> courses
) {
}
