package com.msm.sis.api.dto.student.program.request;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StudentProgramRequestSummaryResponse(
        Long studentProgramRequestId,
        String status,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime requestedAt,
        Long studentId,
        String studentFirstName,
        String studentLastName,
        String studentPreferredName,
        String studentEmail,
        String classStandingName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate estimatedGradDate,
        Long programId,
        Long programVersionId,
        Integer programVersionNumber,
        Integer programVersionClassYearStart,
        Integer programVersionClassYearEnd,
        String programCode,
        String programName,
        String programTypeCode,
        String programTypeName,
        String degreeTypeCode,
        String degreeTypeName,
        Long schoolId,
        String schoolCode,
        String schoolName,
        Long departmentId,
        String departmentCode,
        String departmentName,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime departmentReviewedAt,
        String departmentReviewedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime departmentSignatureAt,
        String departmentSignatureName,
        String departmentSignatureEmail,
        String departmentComment,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime adminReviewedAt,
        String adminReviewedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime adminSignatureAt,
        String adminSignatureName,
        String adminSignatureEmail,
        String adminComment
) {
}
