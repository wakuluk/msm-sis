package com.msm.sis.api.dto.course;

public record ImportAcademicYearCourseOfferingsResponse(
        Long academicYearId,
        int eligibleCurrentCourseVersionCount,
        int createdCourseOfferingCount,
        int skippedExistingCourseOfferingCount
) {
}
