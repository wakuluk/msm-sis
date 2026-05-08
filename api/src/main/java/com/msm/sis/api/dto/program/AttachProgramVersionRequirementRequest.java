package com.msm.sis.api.dto.program;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record AttachProgramVersionRequirementRequest(
        @NotNull
        @Positive
        Long requirementId,

        @PositiveOrZero
        Integer sortOrder,

        @Pattern(regexp = "CONSUME_AVAILABLE|ALLOW_REUSE")
        String courseReusePolicy,

        @Size(max = 500)
        String notes
) {
}
