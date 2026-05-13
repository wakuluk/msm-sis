package com.msm.sis.api.dto.athletics;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record AthleticSportResponse(
        Long athleticSportId,
        String code,
        String name,
        boolean active,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,
        Long updatedByUserId,
        String updatedBy
) {
}
