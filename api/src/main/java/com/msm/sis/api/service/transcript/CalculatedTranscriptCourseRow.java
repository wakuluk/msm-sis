package com.msm.sis.api.service.transcript;

import com.msm.sis.api.dto.student.transcript.StudentTranscriptCourseResponse;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CalculatedTranscriptCourseRow(
        String termLabel,
        LocalDate termSortDate,
        String source,
        boolean transfer,
        String courseCode,
        StudentTranscriptCourseResponse courseResponse,
        boolean midterm,
        BigDecimal attemptedCredits,
        BigDecimal earnedCredits,
        BigDecimal gpaCredits,
        BigDecimal qualityPoints
) {
}
