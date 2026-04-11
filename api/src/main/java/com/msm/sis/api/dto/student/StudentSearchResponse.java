package com.msm.sis.api.dto.student;

import java.util.List;

public record StudentSearchResponse(
        List<StudentSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
