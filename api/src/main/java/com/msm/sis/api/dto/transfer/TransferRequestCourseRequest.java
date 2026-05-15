package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record TransferRequestCourseRequest(
        String externalSubjectCode,
        String externalCourseNumber,
        @NotBlank
        String externalCourseTitle,
        String externalCourseDescription,
        String externalTerm,
        @DecimalMin("0.0")
        BigDecimal requestedCredits,
        @DecimalMin("0.0")
        BigDecimal attemptedCredits,
        @DecimalMin("0.0")
        BigDecimal earnedCredits,
        String grade,
        String reason,
        String studentNotes,
        String requestedLocalCourseEquivalent
) {
}
