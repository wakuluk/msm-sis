package com.msm.sis.api.dto.registration.course;

import java.time.LocalDateTime;

public record StudentCourseRegistrationGroupChoiceResponse(
        Long registrationGroupId,
        String registrationGroupName,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        String statusCode,
        String statusName,
        LocalDateTime registrationOpensAt,
        LocalDateTime registrationClosesAt,
        boolean registrationWindowOpen,
        boolean defaultSelection
) {
}
