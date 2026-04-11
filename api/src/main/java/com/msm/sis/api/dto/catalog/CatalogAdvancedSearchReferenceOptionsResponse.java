package com.msm.sis.api.dto.catalog;

import java.util.List;

public record CatalogAdvancedSearchReferenceOptionsResponse(
        List<CatalogReferenceOptionResponse> academicYears,
        List<AcademicTermReferenceOptionResponse> terms,
        List<CatalogReferenceOptionResponse> departments,
        List<AcademicSubjectReferenceOptionResponse> subjects,
        List<CatalogReferenceOptionResponse> offeringStatuses,
        List<CatalogReferenceOptionResponse> termStatuses
){
}
