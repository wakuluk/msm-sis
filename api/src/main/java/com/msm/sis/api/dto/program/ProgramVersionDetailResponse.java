package com.msm.sis.api.dto.program;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

public record ProgramVersionDetailResponse(
        Long programVersionId,
        Integer versionNumber,
        boolean published,
        Integer classYearStart,
        Integer classYearEnd,
        String notes,
        List<ProgramVersionRequirementResponse> requirements,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
