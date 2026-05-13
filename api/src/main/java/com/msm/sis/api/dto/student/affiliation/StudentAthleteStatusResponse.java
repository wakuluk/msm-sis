package com.msm.sis.api.dto.student.affiliation;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record StudentAthleteStatusResponse(
        Long studentAthleteId,
        Long studentId,
        Long athleticSportId,
        String athleticSportCode,
        String athleticSportName,
        boolean active,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,
        Long updatedByUserId,
        String updatedBy
) {
}
