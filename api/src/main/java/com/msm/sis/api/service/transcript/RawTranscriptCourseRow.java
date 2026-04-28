package com.msm.sis.api.service.transcript;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RawTranscriptCourseRow(
        Long recordId,
        String termLabel,
        LocalDate termSortDate,
        String sourceCode,
        boolean transfer,
        String subjectCode,
        String courseNumber,
        String title,
        String statusCode,
        String statusName,
        boolean completed,
        boolean droppedOrWithdrawn,
        TranscriptRepeatCode repeatCode,
        String repeatName,
        String gradeCode,
        String gradeTypeCode,
        boolean passFail,
        boolean midterm,
        BigDecimal attemptedCredits,
        BigDecimal earnedCredits,
        Boolean includeInGpa,
        Boolean earnsCredit,
        Boolean countsInGpa,
        BigDecimal qualityPointsPerCredit
) {
}
