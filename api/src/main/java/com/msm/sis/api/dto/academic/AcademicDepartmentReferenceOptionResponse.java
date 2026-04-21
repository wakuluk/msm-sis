package com.msm.sis.api.dto.academic;

public record AcademicDepartmentReferenceOptionResponse(
        Long id,
        String code,
        String name,
        Long schoolId
) {
}
