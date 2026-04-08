package com.msm.sis.api.dto;

import java.util.List;

public record StudentSearchResponse(
        List<StudentSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
