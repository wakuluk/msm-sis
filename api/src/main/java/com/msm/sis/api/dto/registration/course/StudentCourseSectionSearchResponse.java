package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record StudentCourseSectionSearchResponse(
        int page,
        int size,
        long totalElements,
        int totalPages,
        List<StudentCourseSectionSearchResultResponse> results
) {
}
