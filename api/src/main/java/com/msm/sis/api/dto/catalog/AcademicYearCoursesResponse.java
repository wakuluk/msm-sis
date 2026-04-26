package com.msm.sis.api.dto.catalog;

import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;

import java.time.LocalDate;
import java.util.List;

public record AcademicYearCoursesResponse(
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        List<TermCoursesResponse> terms
) {
    public record TermCoursesResponse(
            Long termId,
            String code,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            List<SubTermCoursesResponse> subTerms
    ) {
    }

    public record SubTermCoursesResponse(
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
