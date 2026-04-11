package com.msm.sis.api.dto;

import java.util.List;

public record CatalogAdvancedSearchReferenceOptionsResponse(
        List<CatalogReferenceOptionResponse> academicYears,
        List<CatalogTermReferenceOptionResponse> terms,
        List<CatalogReferenceOptionResponse> departments,
        List<CatalogSubjectReferenceOptionResponse> subjects,
        List<CatalogReferenceOptionResponse> offeringStatuses,
        List<CatalogReferenceOptionResponse> termStatuses
){
}
