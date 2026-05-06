package com.msm.sis.api.service.student;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StudentCourseEvidence(
        Long courseId,
        Long departmentId,
        String subjectCode,
        String courseNumber,
        String courseCode,
        String title,
        BigDecimal creditsEarned,
        String source,
        Long sourceRecordId,
        LocalDate completedDate
) {
}
