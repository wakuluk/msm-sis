package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSectionStagingListResponse(
        Long subTermId,
        List<CourseSectionStagingResultResponse> results,
        int totalElements
) {
}
