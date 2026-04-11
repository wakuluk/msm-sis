package com.msm.sis.api.dto;

import java.math.BigDecimal;

public record CourseOfferingSearchResultResponse(
        Long courseOfferingId,
        Long courseId,
        Long courseVersionId,
        String termCode,
        String termName,
        String subjectCode,
        String courseNumber,
        String courseCode,
        String title,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean variableCredit,
        String offeringStatusCode,
        String offeringStatusName
) {
}
