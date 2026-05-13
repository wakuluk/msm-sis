package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSectionStageTransitionResponse(
        Long subTermId,
        String sourceStatusCode,
        String targetStatusCode,
        List<CourseSectionStagingResultResponse> movedRows,
        List<CourseSectionStageTransitionIssueResponse> blockingIssues,
        int movedCount,
        int blockingIssueCount
) {
}
