package com.msm.sis.api.dto.transfer;

import java.math.BigDecimal;
import java.util.List;

public record StudentApprovedTransferRequestCourseResponse(
        Long transferRequestCourseId,
        String externalSubjectCode,
        String externalCourseNumber,
        String externalCourseTitle,
        String externalCourseDescription,
        String externalTerm,
        BigDecimal requestedCredits,
        BigDecimal attemptedCredits,
        BigDecimal acceptedCredits,
        String grade,
        String reason,
        List<StudentApprovedTransferRequestOutcomeResponse> outcomes
) {
}
