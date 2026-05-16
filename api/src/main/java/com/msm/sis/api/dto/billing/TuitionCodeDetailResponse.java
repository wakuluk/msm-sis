package com.msm.sis.api.dto.billing;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record TuitionCodeDetailResponse(
        Long tuitionCodeId,
        String code,
        String name,
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

