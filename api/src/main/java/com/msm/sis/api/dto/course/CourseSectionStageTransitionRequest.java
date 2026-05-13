package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CourseSectionStageTransitionRequest(
        @NotNull
        @Positive
        Long subTermId,

        @NotBlank
        @Size(max = 50)
        String sourceStatusCode,

        @NotBlank
        @Size(max = 50)
        String targetStatusCode,

        @NotEmpty
        List<@NotNull @Positive Long> sectionIds
) {
}
