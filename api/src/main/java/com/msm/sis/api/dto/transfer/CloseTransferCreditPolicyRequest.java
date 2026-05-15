package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CloseTransferCreditPolicyRequest(
        @NotNull
        LocalDate effectiveEndDate
) {
}
