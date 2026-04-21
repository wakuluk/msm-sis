package com.msm.sis.api.dto.catalog;

import com.msm.sis.api.dto.academic.AcademicSubjectReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicTermReferenceOptionResponse;

import java.util.List;

public record CatalogSearchReferenceOptionsResponse(
        List<CodeNameReferenceOptionResponse> academicYears,
        List<AcademicTermReferenceOptionResponse> terms,
        List<CodeNameReferenceOptionResponse> departments,
        List<AcademicSubjectReferenceOptionResponse> subjects
) {
}
