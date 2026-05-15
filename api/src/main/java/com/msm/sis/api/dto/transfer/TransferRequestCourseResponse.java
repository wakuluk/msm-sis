package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferRequestCourseResponse(
        Long transferRequestCourseId,
        Long transferRequestId,
        String externalSubjectCode,
        String externalCourseNumber,
        String externalCourseTitle,
        String externalCourseDescription,
        String externalTerm,
        BigDecimal requestedCredits,
        BigDecimal attemptedCredits,
        BigDecimal earnedCredits,
        String grade,
        String reason,
        String studentNotes,
        String requestedLocalCourseEquivalent,
        Integer sortOrder,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
