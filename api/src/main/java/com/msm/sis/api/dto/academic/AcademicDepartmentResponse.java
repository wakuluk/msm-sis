package com.msm.sis.api.dto.academic;

public record AcademicDepartmentResponse(
        Long departmentId,
        String code,
        String name,
        boolean active,
        java.util.List<AcademicDepartmentSubjectResponse> subjects
) {
}
