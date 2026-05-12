package com.msm.sis.api.dto.registration;

public record RegistrationGroupPublishValidationIssueResponse(
        Long registrationGroupId,
        String groupName,
        String field,
        String code,
        String message
) {
}
