package com.msm.sis.api.dto.student.program.assignment;

import java.time.LocalDate;

public record StudentProgramAssignmentSearchResultResponse(
        Long studentProgramId,
        Long studentProgramRequestId,
        String status,
        LocalDate declaredDate,
        LocalDate completedDate,
        Long studentId,
        String studentFirstName,
        String studentLastName,
        String studentPreferredName,
        String studentEmail,
        String classStandingName,
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
