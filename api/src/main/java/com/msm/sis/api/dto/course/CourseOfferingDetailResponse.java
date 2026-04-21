package com.msm.sis.api.dto.course;

import java.math.BigDecimal;
import java.util.List;

public record CourseOfferingDetailResponse(
        Long courseOfferingId,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long courseId,
        Long courseVersionId,
        String courseCode,
        String title,
        String catalogDescription,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean variableCredit,
        List<TermDetail> terms,
        String offeringStatusCode,
        String offeringStatusName,
        String notes
) {
    public record TermDetail(
            Long termId,
            String code,
            String name
    ) {
    }
}
