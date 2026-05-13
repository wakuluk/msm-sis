package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record StudentCourseRegistrationScheduleConflictErrorResponse(
        String message,
        List<StudentCourseRegistrationScheduleConflictResponse> conflicts
) {
}
