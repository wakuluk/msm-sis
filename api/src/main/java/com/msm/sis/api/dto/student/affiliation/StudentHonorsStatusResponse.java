package com.msm.sis.api.dto.student.affiliation;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record StudentHonorsStatusResponse(
        Long studentHonorsId,
        Long studentId,
        boolean active,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,
        Long updatedByUserId,
        String updatedBy
) {
}
