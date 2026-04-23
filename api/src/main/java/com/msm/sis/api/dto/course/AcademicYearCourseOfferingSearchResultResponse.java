package com.msm.sis.api.dto.course;

import java.math.BigDecimal;
import java.util.List;

public record AcademicYearCourseOfferingSearchResultResponse(
        Long courseOfferingId,
        Long courseId,
        Long courseVersionId,
        Long schoolId,
        String schoolCode,
        String schoolName,
        Long departmentId,
        String departmentCode,
        String departmentName,
        Long subjectId,
        String subjectCode,
        String subjectName,
        String courseNumber,
        String courseCode,
        String title,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean variableCredit,
        List<SubTermResult> subTerms,
        String offeringStatusCode,
        String offeringStatusName
) {
    public record SubTermResult(
            Long subTermId,
            String code,
            String name
    ) {
    }
}
