package com.msm.sis.api.service.student;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StudentRequirementWaiver(
        Long transferRequestOutcomeId,
        Long requirementId,
        Long programVersionRequirementId,
        BigDecimal acceptedCredits,
        String notes,
        LocalDateTime approvedAt
) {
}
