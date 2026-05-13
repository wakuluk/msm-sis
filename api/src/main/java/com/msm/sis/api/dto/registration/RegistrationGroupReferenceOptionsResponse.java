package com.msm.sis.api.dto.registration;

import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;

import java.util.List;

public record RegistrationGroupReferenceOptionsResponse(
        List<RegistrationGroupAcademicYearOptionResponse> academicYears,
        List<CodeNameReferenceOptionResponse> academicDivisions,
        List<CodeNameReferenceOptionResponse> athleticSports,
        List<RegistrationGroupStatusOptionResponse> statuses
) {
}
