package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record StudentCourseRegistrationScheduleConflictResponse(
        Long proposedCourseId,
        Long proposedSectionId,
        String proposedCourseCode,
        String proposedSectionCode,
        Long proposedSubTermId,
        String proposedSubTermCode,
        String proposedSubTermName,
        Long conflictingCourseId,
        Long conflictingSectionId,
        String conflictingCourseCode,
        String conflictingSectionCode,
        Long conflictingSubTermId,
        String conflictingSubTermCode,
        String conflictingSubTermName,
        String conflictSource,
        List<StudentCourseRegistrationScheduleConflictMeetingResponse> meetings
) {
}
