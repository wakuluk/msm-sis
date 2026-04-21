package com.msm.sis.api.dto.academic;

public record AcademicSubjectReferenceOptionResponse(
        Long id,
        String code,
        String name,
        Long departmentId,
        String departmentCode,
        String departmentName
) {
}
