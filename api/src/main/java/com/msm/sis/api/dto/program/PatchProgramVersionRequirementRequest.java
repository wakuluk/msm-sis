package com.msm.sis.api.dto.program;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record PatchProgramVersionRequirementRequest(
        @PositiveOrZero
        Integer sortOrder,

        @Pattern(regexp = "CONSUME_AVAILABLE|ALLOW_REUSE")
        String courseReusePolicy,

        @Size(max = 500)
        String notes
) {
}
