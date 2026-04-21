package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseOfferingSearchResponse(
        List<CourseOfferingSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
