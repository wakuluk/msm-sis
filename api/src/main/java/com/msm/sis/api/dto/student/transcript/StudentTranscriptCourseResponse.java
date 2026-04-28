package com.msm.sis.api.dto.student.transcript;

import java.math.BigDecimal;

public record StudentTranscriptCourseResponse(
        Long recordId,
        String source,
        String courseCode,
        String title,
        String statusCode,
        String statusName,
        String repeatCode,
        String repeatName,
        String gradeCode,
        String gradeTypeCode,
        BigDecimal attemptedCredits,
        BigDecimal earnedCredits,
        BigDecimal gpaCredits,
        BigDecimal qualityPoints
) {
}
