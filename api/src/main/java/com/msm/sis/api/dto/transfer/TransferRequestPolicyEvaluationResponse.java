package com.msm.sis.api.dto.transfer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TransferRequestPolicyEvaluationResponse(
        Long transferRequestId,
        Long transferCreditPolicyId,
        LocalDate policyEffectiveStartDate,
        LocalDate policyEffectiveEndDate,
        String minimumTransferGrade,
        Integer fourYearInstitutionCreditThreshold,
        Boolean requireTranscriptPdf,
        BigDecimal currentStudentTransferCredits,
        BigDecimal requestTransferCredits,
        BigDecimal studentTransferCreditsAfterApproved,
        String institutionLevel,
        boolean thresholdApplies,
        boolean transcriptPdfAttached,
        boolean hasFailures,
        List<TransferRequestPolicyCheckResponse> checks
) {
}
