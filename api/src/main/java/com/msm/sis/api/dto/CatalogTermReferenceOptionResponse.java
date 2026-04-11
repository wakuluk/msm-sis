package com.msm.sis.api.dto;

public record CatalogTermReferenceOptionResponse(
        Long id,
        String code,
        String name,
        Long academicYearId,
        String academicYearCode,
        String academicYearName
) {
}
