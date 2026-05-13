package com.msm.sis.api.dto.registration;

public record RegistrationGroupExistingAssignmentResponse(
        Long registrationGroupId,
        String groupName,
        String statusCode,
        String statusName,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName
) {
}
