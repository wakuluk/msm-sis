package com.msm.sis.api.dto.program;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateProgramVersionRequest(
        Boolean published,

        @NotNull
        @Min(1900)
        Integer classYearStart,

        @Min(1900)
        Integer classYearEnd,

        @Size(max = 500)
        String notes
) {
}
