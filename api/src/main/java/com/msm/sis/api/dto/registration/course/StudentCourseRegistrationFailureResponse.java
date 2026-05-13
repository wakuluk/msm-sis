package com.msm.sis.api.dto.registration.course;

public record StudentCourseRegistrationFailureResponse(
        Long selectionId,
        Long sectionId,
        String courseCode,
        String displaySectionCode,
        String failureCode,
        String message,
        boolean retryable,
        boolean selectionRetained
) {
}
