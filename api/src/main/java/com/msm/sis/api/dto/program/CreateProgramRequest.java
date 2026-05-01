package com.msm.sis.api.dto.program;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateProgramRequest(
        @Positive
        Long schoolId,

        @Positive
        Long departmentId,

        @NotNull
        @Positive
        Long programTypeId,

        @Positive
        Long degreeTypeId,

        @NotBlank
        @Size(max = 50)
        String code,

        @NotBlank
        @Size(max = 255)
        String name,

        String description,

        @Valid
        @NotNull
        CreateProgramVersionRequest initialVersion
) {
}
