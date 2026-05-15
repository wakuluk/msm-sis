package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record StudentTransferRequestCourseRequest(
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
        String reason,
        String studentNotes,
        String requestedLocalCourseEquivalent
) {
}
