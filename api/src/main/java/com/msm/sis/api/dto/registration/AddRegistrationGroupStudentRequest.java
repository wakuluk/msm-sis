package com.msm.sis.api.dto.registration;

public record AddRegistrationGroupStudentRequest(
        Long studentId,
        Boolean moveExistingAssignment
) {
}
