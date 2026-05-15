package com.msm.sis.api.dto.transfer;

public record TransferRequestPolicyCheckResponse(
        String checkType,
        String label,
        boolean passed,
        boolean waived,
        boolean waivable,
        String status,
        String message
) {
}
