package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSearchResponse(
        List<CourseSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
