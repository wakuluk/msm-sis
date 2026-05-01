package com.msm.sis.api.dto.program;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record PatchProgramVersionRequirementRequest(
        @PositiveOrZero
        Integer sortOrder,

        @Size(max = 500)
        String notes
) {
}
