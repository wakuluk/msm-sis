package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.NotBlank;

public record PatchTransferRequestWorkflowRequest(
        @NotBlank
        String status,
        String decisionNotes
) {
}
