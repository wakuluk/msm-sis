package com.msm.sis.api.dto.transfer;

import java.math.BigDecimal;

public record TransferCourseEquivalencyOutcomeResponse(
        Long transferCourseEquivalencyOutcomeId,
        Long transferCourseEquivalencyId,
        String outcomeType,
        Long localCourseId,
        String localCourseCode,
        Long requirementId,
        String requirementCode,
        String requirementName,
        Long programVersionRequirementId,
        BigDecimal acceptedCredits,
        String notes,
        Integer sortOrder
) {
}
