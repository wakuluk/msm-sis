package com.msm.sis.api.dto.catalog;

import java.util.List;

public record CatalogSearchReferenceOptionsResponse(
        List<CatalogReferenceOptionResponse> academicYears,
        List<AcademicTermReferenceOptionResponse> terms,
        List<CatalogReferenceOptionResponse> departments,
        List<AcademicSubjectReferenceOptionResponse> subjects
) {
}
