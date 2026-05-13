package com.msm.sis.api.dto.registration;

import java.time.LocalDateTime;
import java.util.List;

public record RegistrationGroupPublishGroupResponse(
        Long registrationGroupId,
        String name,
        String statusCode,
        String statusName,
        LocalDateTime registrationOpensAt,
        LocalDateTime registrationClosesAt,
        long studentCount,
        boolean hasRegistrationWindow,
        boolean publishable,
        List<RegistrationGroupPublishValidationIssueResponse> validationIssues
) {
}
