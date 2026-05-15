package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record TransferRequestOutcomeRequest(
        @NotBlank
        String outcomeType,
        Long localCourseId,
        Long requirementId,
        Long programVersionRequirementId,
        @DecimalMin("0.0")
        BigDecimal acceptedCredits,
        String notes
) {
}
