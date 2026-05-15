package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record TransferRequestResponse(
        Long transferRequestId,
        Long studentId,
        String studentNumber,
        String studentName,
        String studentEmail,
        Integer classOf,
        java.util.List<String> divisionNames,
        Long transferCreditPolicyId,
        TransferRequestInstitutionResponse institution,
        TransferRequestCourseResponse primaryCourse,
        String status,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime submittedAt,
        Long decidedByUserId,
        String decidedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime decidedAt,
        String decisionNotes,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
