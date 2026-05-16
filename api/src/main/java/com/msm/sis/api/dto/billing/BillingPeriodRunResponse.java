package com.msm.sis.api.dto.billing;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record BillingPeriodRunResponse(
        Long billingPeriodRunId,
        Long billingPeriodId,
        String status,
        String billingPeriodStatusAtRun,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime startedAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime completedAt,
        String triggerSource,
        Long triggeredByUserId,
        String triggeredByUserEmail,
        String message,
        Long createdByUserId,
        String createdByUserEmail,
        Long updatedByUserId,
        String updatedByUserEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
