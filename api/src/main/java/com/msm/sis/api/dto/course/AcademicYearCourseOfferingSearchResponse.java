package com.msm.sis.api.dto.course;

import java.util.List;

public record AcademicYearCourseOfferingSearchResponse(
        List<AcademicYearCourseOfferingSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
