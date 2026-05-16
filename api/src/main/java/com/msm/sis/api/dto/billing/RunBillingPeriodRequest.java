package com.msm.sis.api.dto.billing;

import jakarta.validation.constraints.Size;

public record RunBillingPeriodRequest(
        @Size(max = 255, message = "Message must be 255 characters or fewer.")
        String message
) {
}
