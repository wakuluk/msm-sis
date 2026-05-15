package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record UpsertTransferCreditPolicyRequest(
        @NotNull
        LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        @NotBlank
        @Pattern(regexp = "A|A-|B\\+|B|B-|C\\+|C|C-|D|F")
        String minimumTransferGrade,
        @NotNull
        @Min(0)
        Integer fourYearInstitutionCreditThreshold,
        @NotNull
        Boolean requireTranscriptPdf,
        String notes
) {
}
