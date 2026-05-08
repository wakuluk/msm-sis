package com.msm.sis.api.service.student;

import java.math.BigDecimal;

public record StudentRequirementMatchedCourse(
        Long courseId,
        String courseCode,
        String title,
        BigDecimal credits,
        String status,
        String source,
        Long sourceRecordId,
        Long plannedCourseId,
        String plannedTermLabel,
        String plannedYearLabel
) {
}
