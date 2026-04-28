package com.msm.sis.api.dto.catalog;

import java.util.List;

public record AcademicYearCoursesSummaryResponse(
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        long termCount,
        long subTermCount,
        long courseOfferingCount,
        List<TermSummary> terms
) {
    public record TermSummary(
            Long termId,
            String code,
            String name,
            long subTermCount,
            long courseOfferingCount,
            List<SubTermSummary> subTerms
    ) {
    }

    public record SubTermSummary(
            Long subTermId,
            String code,
            String name,
            long courseOfferingCount
    ) {
    }
}
