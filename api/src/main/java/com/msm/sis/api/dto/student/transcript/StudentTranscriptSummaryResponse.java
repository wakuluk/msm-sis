package com.msm.sis.api.dto.student.transcript;

import java.math.BigDecimal;

public record StudentTranscriptSummaryResponse(
        BigDecimal attemptedCredits,
        BigDecimal earnedCredits,
        BigDecimal gpaCredits,
        BigDecimal qualityPoints,
        BigDecimal gpa
) {
}
