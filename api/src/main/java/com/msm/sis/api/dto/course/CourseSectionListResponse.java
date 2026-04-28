package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSectionListResponse(
        Long courseOfferingId,
        Long subTermId,
        List<CourseSectionListResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
