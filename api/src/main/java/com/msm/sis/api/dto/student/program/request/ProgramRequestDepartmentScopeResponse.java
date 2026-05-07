package com.msm.sis.api.dto.student.program.request;

public record ProgramRequestDepartmentScopeResponse(
        Long departmentId,
        String departmentCode,
        String departmentName,
        Long schoolId,
        String schoolCode,
        String schoolName
) {
}
