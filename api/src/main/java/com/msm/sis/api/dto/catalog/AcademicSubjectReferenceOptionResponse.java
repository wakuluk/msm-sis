package com.msm.sis.api.dto.catalog;

public record AcademicSubjectReferenceOptionResponse(
        Long id,
        String code,
        String name,
        Long departmentId,
        String departmentCode,
        String departmentName
) {
}
