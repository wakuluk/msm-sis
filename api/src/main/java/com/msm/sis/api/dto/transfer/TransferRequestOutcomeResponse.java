package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferRequestOutcomeResponse(
        Long transferRequestOutcomeId,
        Long transferRequestCourseId,
        String outcomeType,
        Long localCourseId,
        String localCourseCode,
        Long requirementId,
        String requirementCode,
        String requirementName,
        Long programVersionRequirementId,
        BigDecimal acceptedCredits,
        String notes,
        Long approvedByUserId,
        String approvedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime approvedAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
