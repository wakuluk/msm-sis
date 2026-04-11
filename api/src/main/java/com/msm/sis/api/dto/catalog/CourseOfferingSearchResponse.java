package com.msm.sis.api.dto.catalog;

import java.util.List;

public record CourseOfferingSearchResponse(
        List<CourseOfferingSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
