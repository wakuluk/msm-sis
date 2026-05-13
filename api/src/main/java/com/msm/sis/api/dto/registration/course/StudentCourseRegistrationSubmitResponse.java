package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record StudentCourseRegistrationSubmitResponse(
        String message,
        int submittedCount,
        int registeredCount,
        int waitlistedCount,
        int removedFailureCount,
        int retryableFailureCount,
        List<StudentCourseRegistrationEnrollmentResponse> registered,
        List<StudentCourseRegistrationEnrollmentResponse> waitlisted,
        List<StudentCourseRegistrationFailureResponse> removedFailures,
        List<StudentCourseRegistrationFailureResponse> retryableFailures,
        List<StudentCourseRegistrationWarningResponse> warnings,
        StudentCourseRegistrationResponse registrationPage
) {
}
