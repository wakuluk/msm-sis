package com.msm.sis.api.dto.course;

import java.math.BigDecimal;

public record CourseOfferingSearchResultResponse(
        Long courseOfferingId,
        Long courseId,
        Long courseVersionId,
        String subTermCode,
        String subTermName,
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
