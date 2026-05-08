package com.msm.sis.api.dto.student.program;

import java.math.BigDecimal;

public record StudentRequirementMatchedCourseResponse(
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
