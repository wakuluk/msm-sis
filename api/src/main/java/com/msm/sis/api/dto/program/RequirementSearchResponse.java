package com.msm.sis.api.dto.program;

import java.util.List;

public record RequirementSearchResponse(
        List<RequirementSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
