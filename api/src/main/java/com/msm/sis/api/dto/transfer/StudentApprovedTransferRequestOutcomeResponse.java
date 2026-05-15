package com.msm.sis.api.dto.transfer;

import java.math.BigDecimal;

public record StudentApprovedTransferRequestOutcomeResponse(
        Long transferRequestOutcomeId,
        String outcomeType,
        Long localCourseId,
        String localCourseCode,
        Long requirementId,
        String requirementCode,
        String requirementName,
        Long programVersionRequirementId,
        BigDecimal acceptedCredits
) {
}
