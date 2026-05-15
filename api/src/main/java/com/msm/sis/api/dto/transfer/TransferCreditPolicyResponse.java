package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TransferCreditPolicyResponse(
        Long transferCreditPolicyId,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate effectiveStartDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate effectiveEndDate,
        String minimumTransferGrade,
        Integer fourYearInstitutionCreditThreshold,
        Boolean requireTranscriptPdf,
        String notes,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
