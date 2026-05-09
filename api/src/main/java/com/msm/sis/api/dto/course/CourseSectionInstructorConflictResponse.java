package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSectionInstructorConflictResponse(
        Long staffId,
        Long instructorUserId,
        String instructorName,
        Long conflictingSectionId,
        String conflictingSectionCode,
        String conflictingSectionDisplay,
        Long subTermId,
        String subTermCode,
        String subTermName,
        Long conflictingSubTermId,
        String conflictingSubTermCode,
        String conflictingSubTermName,
        List<CourseSectionInstructorConflictMeetingResponse> meetings
) {
}
