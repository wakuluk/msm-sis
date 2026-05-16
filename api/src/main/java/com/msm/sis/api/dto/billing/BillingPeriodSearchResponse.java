package com.msm.sis.api.dto.billing;

import java.util.List;

public record BillingPeriodSearchResponse(
        List<BillingPeriodSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
