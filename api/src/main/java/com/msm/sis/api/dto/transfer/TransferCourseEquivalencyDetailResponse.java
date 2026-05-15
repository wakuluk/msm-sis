package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record TransferCourseEquivalencyDetailResponse(
        Long transferCourseEquivalencyId,
        Long transferInstitutionId,
        String transferInstitutionName,
        String externalSubjectCode,
        String externalCourseNumber,
        String externalCourseTitle,
        String externalCourseDescription,
        BigDecimal externalCredits,
        Boolean active,
        String notes,
        List<TransferCourseEquivalencyOutcomeResponse> outcomes,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
