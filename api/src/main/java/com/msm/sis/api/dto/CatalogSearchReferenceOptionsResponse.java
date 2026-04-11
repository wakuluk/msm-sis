package com.msm.sis.api.dto;

import java.util.List;

public record CatalogSearchReferenceOptionsResponse(
        List<CatalogReferenceOptionResponse> academicYears,
        List<CatalogTermReferenceOptionResponse> terms,
        List<CatalogReferenceOptionResponse> departments,
        List<CatalogSubjectReferenceOptionResponse> subjects
) {
}
