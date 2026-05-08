package com.msm.sis.api.dto.student.program.request;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record StudentProgramReviewSummaryResponse(
        Long studentProgramId,
        String status,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate declaredDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate completedDate,
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
        String departmentName
) {
}
