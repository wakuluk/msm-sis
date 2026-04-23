package com.msm.sis.api.dto.catalog;

import com.msm.sis.api.dto.academic.AcademicSubjectReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSubTermReferenceOptionResponse;

import java.util.List;

public record CatalogAdvancedSearchReferenceOptionsResponse(
        List<CodeNameReferenceOptionResponse> academicYears,
        List<AcademicSubTermReferenceOptionResponse> subTerms,
        List<CodeNameReferenceOptionResponse> departments,
        List<AcademicSubjectReferenceOptionResponse> subjects,
        List<CodeNameReferenceOptionResponse> offeringStatuses,
        List<CodeNameReferenceOptionResponse> subTermStatuses
){
}
