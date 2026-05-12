package com.msm.sis.api.dto.registration;

public record RegistrationGroupEmailNotificationResponse(
        Long registrationGroupId,
        String registrationGroupName,
        int assignedStudentCount,
        int sentEmailCount,
        String recipient,
        String message
) {
}
