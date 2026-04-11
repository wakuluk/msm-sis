package com.msm.sis.api.dto;

import java.math.BigDecimal;

public record CourseOfferingDetailResponse(
        Long courseOfferingId,
        String courseCode,
        String title,
        String catalogDescription,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean variableCredit,
        String termCode,
        String termName,
        String offeringStatusCode,
        String offeringStatusName,
        String notes
) {
}
