package com.msm.sis.api.dto.course;

import java.time.LocalTime;

public record CourseSectionInstructorConflictMeetingResponse(
        Short dayOfWeek,
        LocalTime proposedStartTime,
        LocalTime proposedEndTime,
        LocalTime conflictingStartTime,
        LocalTime conflictingEndTime
) {
}
