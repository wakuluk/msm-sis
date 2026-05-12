package com.msm.sis.api.service.registration;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StudentCoursePrerequisiteEvidence(
        Long courseId,
        Long departmentId,
        String subjectCode,
        String courseNumber,
        String courseCode,
        String title,
        BigDecimal credits,
        String gradeCode,
        String source,
        Long sourceRecordId,
        String statusCode,
        LocalDate evidenceDate,
        boolean currentEnrollment
) {
}
