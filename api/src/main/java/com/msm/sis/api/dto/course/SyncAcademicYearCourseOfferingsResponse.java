package com.msm.sis.api.dto.course;

public record SyncAcademicYearCourseOfferingsResponse(
        Long academicYearId,
        int scannedCourseOfferingCount,
        int updatedCourseOfferingCount,
        int alreadyCurrentCourseOfferingCount,
        int skippedMissingCurrentCourseVersionCount,
        int skippedDuplicateCurrentOfferingCount
) {
}
