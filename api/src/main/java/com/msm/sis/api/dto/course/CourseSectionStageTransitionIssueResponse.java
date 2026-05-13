package com.msm.sis.api.dto.course;

public record CourseSectionStageTransitionIssueResponse(
        Long sectionId,
        String sectionCode,
        String currentStatusCode,
        String currentStatusName,
        String issueCode,
        String message
) {
}
