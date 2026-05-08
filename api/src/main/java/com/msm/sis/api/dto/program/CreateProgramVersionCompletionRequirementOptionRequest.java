package com.msm.sis.api.dto.program;

import jakarta.validation.constraints.Positive;

public record CreateProgramVersionCompletionRequirementOptionRequest(
        @Positive
        Long requiredProgramTypeId,

        @Positive
        Long requiredProgramId,

        @Positive
        Long requiredProgramVersionId
) {
}
