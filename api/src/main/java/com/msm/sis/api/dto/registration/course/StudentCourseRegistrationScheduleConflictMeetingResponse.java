package com.msm.sis.api.dto.registration.course;

import java.time.LocalTime;

public record StudentCourseRegistrationScheduleConflictMeetingResponse(
        Short dayOfWeek,
        LocalTime proposedStartTime,
        LocalTime proposedEndTime,
        LocalTime conflictingStartTime,
        LocalTime conflictingEndTime
) {
}
