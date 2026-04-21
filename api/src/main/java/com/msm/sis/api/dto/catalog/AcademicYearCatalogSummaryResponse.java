package com.msm.sis.api.dto.catalog;

import java.util.List;

public record AcademicYearCatalogSummaryResponse(
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        long termGroupCount,
        long termCount,
        long courseOfferingCount,
        List<TermGroupSummary> termGroups
) {
    public record TermGroupSummary(
            Long termGroupId,
            String code,
            String name,
            long termCount,
            long courseOfferingCount,
            List<TermSummary> terms
    ) {
    }

    public record TermSummary(
            Long termId,
            String code,
            String name,
            long courseOfferingCount
    ) {
    }
}
