package com.msm.sis.api.dto.catalog;

public record CatalogTermReferenceOptionResponse(
        Long id,
        String code,
        String name,
        Long academicYearId,
        String academicYearCode,
        String academicYearName
) {
}
