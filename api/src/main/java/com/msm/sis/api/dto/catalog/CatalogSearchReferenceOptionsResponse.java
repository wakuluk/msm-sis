package com.msm.sis.api.dto.catalog;

import com.msm.sis.api.dto.academic.AcademicSubjectReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSubTermReferenceOptionResponse;

import java.util.List;

public record CatalogSearchReferenceOptionsResponse(
        List<CodeNameReferenceOptionResponse> academicYears,
        List<AcademicSubTermReferenceOptionResponse> subTerms,
        List<CodeNameReferenceOptionResponse> departments,
        List<AcademicSubjectReferenceOptionResponse> subjects
) {
}
