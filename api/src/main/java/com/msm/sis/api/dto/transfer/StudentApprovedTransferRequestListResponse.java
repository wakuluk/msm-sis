package com.msm.sis.api.dto.transfer;

import java.util.List;

public record StudentApprovedTransferRequestListResponse(
        List<StudentApprovedTransferRequestResponse> requests
) {
}
