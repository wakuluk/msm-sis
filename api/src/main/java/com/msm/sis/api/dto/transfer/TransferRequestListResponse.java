package com.msm.sis.api.dto.transfer;

import java.util.List;

public record TransferRequestListResponse(
        List<TransferRequestResponse> requests
) {
}
