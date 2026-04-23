package com.msm.sis.api.dto.catalog;

import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;

import java.time.LocalDate;
import java.util.List;

public record AcademicYearCatalogResponse(
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        List<TermCatalogResponse> terms
) {
    public record TermCatalogResponse(
            Long termId,
            String code,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            List<SubTermCatalogResponse> subTerms
    ) {
    }

    public record SubTermCatalogResponse(
            Long subTermId,
            String code,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            long courseOfferingCount,
            List<CourseOfferingSearchResultResponse> courseOfferings
    ) {
    }
}
