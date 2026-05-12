package com.msm.sis.api.dto.registration;

public record RegistrationGroupStudentOptionResponse(
        Long studentId,
        String studentNumber,
        String firstName,
        String lastName,
        String displayName,
        String email,
        String classStanding,
        Integer classOf,
        RegistrationGroupExistingAssignmentResponse existingAssignment
) {
}
