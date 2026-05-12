package com.msm.sis.api.dto.athletics;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAthleticSportRequest(
        @NotBlank
        @Size(max = 30)
        String code,

        @NotBlank
        @Size(max = 255)
        String name,

        @NotNull
        Boolean active
) {
}
