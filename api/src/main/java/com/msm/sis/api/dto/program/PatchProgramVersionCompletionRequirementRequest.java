package com.msm.sis.api.dto.program;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PatchProgramVersionCompletionRequirementRequest(
        @Positive
        Integer minimumCount,

        @PositiveOrZero
        Integer sortOrder,

        @Size(max = 500)
        String notes,

        @Valid
        List<PatchProgramVersionCompletionRequirementOptionRequest> options
) {
}
