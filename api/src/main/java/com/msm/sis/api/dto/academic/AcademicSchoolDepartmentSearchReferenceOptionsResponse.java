package com.msm.sis.api.dto.academic;

import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;

import java.util.List;

public record AcademicSchoolDepartmentSearchReferenceOptionsResponse(
        List<CodeNameReferenceOptionResponse> schools,
        List<AcademicDepartmentReferenceOptionResponse> departments
) {
}
