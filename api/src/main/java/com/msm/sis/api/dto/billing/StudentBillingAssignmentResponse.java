package com.msm.sis.api.dto.billing;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record StudentBillingAssignmentResponse(
        Long studentId,
        Long studentTuitionCodeAssignmentId,
        Long tuitionCodeId,
        String tuitionCode,
        String tuitionCodeName,
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

