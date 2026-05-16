package com.msm.sis.api.dto.billing;

import java.util.List;

public record TuitionCodeSearchResponse(
        List<TuitionCodeSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}

