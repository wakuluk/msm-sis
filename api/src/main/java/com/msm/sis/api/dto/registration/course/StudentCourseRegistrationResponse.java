package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record StudentCourseRegistrationResponse(
        Long studentId,
        String studentDisplayName,
        StudentCourseRegistrationWindowResponse registrationWindow,
        List<StudentCourseRegistrationSelectionResponse> selections,
        List<StudentCourseRegistrationEnrollmentResponse> enrolled,
        List<StudentCourseRegistrationEnrollmentResponse> waitlisted,
        List<StudentCourseRegistrationEnrollmentResponse> expiredWaitlist,
        List<StudentCourseRegistrationScheduleMeetingResponse> scheduleMeetings
) {
}
