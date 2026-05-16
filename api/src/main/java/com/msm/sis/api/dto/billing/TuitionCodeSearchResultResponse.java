package com.msm.sis.api.dto.billing;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record TuitionCodeSearchResultResponse(
        Long tuitionCodeId,
        String code,
        String name,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}

