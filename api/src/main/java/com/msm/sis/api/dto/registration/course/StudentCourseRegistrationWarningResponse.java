package com.msm.sis.api.dto.registration.course;

public record StudentCourseRegistrationWarningResponse(
        Long selectionId,
        Long sectionId,
        String courseCode,
        String displaySectionCode,
        String warningCode,
        String message
) {
}
