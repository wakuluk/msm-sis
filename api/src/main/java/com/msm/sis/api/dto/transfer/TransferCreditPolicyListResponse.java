package com.msm.sis.api.dto.transfer;

import java.util.List;

public record TransferCreditPolicyListResponse(
        List<TransferCreditPolicyResponse> policies
) {
}
