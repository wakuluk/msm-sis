package com.msm.sis.api.dto.academic;

import java.util.List;

public record AcademicSchoolResponse(
        Long schoolId,
        String code,
        String name,
        boolean active,
        List<AcademicDepartmentResponse> departments
) {
}
