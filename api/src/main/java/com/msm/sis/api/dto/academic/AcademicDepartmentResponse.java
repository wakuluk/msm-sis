package com.msm.sis.api.dto.academic;

import java.util.List;

public record AcademicDepartmentResponse(
        Long departmentId,
        String code,
        String name,
        boolean active,
        Long schoolId,
        String schoolCode,
        String schoolName,
        List<AcademicDepartmentSubjectResponse> subjects
) {
}
