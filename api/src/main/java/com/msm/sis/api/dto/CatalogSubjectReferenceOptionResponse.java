package com.msm.sis.api.dto;

public record CatalogSubjectReferenceOptionResponse(
        Long id,
        String code,
        String name,
        Long departmentId,
        String departmentCode,
        String departmentName
) {
}
