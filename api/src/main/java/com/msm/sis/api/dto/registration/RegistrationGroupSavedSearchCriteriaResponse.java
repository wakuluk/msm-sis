package com.msm.sis.api.dto.registration;

import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;

import java.math.BigDecimal;
import java.util.List;

public record RegistrationGroupSavedSearchCriteriaResponse(
        Long generationId,
        String name,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        String studentSearchText,
        String programSearchText,
        String groupNamePrefix,
        CodeNameReferenceOptionResponse academicDivision,
        String honorsFilter,
        String athleteFilter,
        String existingGroupFilter,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean includeCurrentCredits,
        boolean includeTransferCredits,
        Integer splitCount,
        Integer matchedStudentCount,
        List<CodeNameReferenceOptionResponse> athleticSports
) {
}
