package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferCourseEquivalencySummaryResponse(
        Long transferCourseEquivalencyId,
        Long transferInstitutionId,
        String externalSubjectCode,
        String externalCourseNumber,
        String externalCourseTitle,
        String externalCourseDescription,
        BigDecimal externalCredits,
        Boolean active,
        String notes,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
