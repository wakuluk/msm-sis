package com.msm.sis.api.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateCourseRequest(
        @NotNull
        @Positive
        Long subjectId,

        @NotBlank
        @Size(max = 20)
        String courseNumber,

        Boolean lab,

        Boolean active,

        @Valid
        @NotNull
        CreateCourseVersionRequest initialVersion,

        @Valid
        CreateAssociatedLabCourseRequest associatedLab
) {
}
