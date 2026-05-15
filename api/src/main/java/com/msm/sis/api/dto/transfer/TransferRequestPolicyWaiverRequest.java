package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.NotBlank;

public record TransferRequestPolicyWaiverRequest(
        @NotBlank
        String policyCheckType,
        @NotBlank
        String reason
) {
}
