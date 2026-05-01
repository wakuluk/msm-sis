package com.msm.sis.api.dto.program;

import com.msm.sis.api.dto.academic.AcademicDepartmentReferenceOptionResponse;
import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;

import java.util.List;

public record ProgramReferenceOptionsResponse(
        List<CodeNameReferenceOptionResponse> programTypes,
        List<CodeNameReferenceOptionResponse> degreeTypes,
        List<CodeNameReferenceOptionResponse> schools,
        List<AcademicDepartmentReferenceOptionResponse> departments
) {
}
