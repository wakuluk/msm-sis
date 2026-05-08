package com.msm.sis.api.dto.course;

public record CourseSectionEnrollmentSummaryResponse(
        int enrolledCount,
        int waitlistedCount,
        int capacity,
        Integer hardCapacity,
        boolean waitlistAllowed
) {
}
