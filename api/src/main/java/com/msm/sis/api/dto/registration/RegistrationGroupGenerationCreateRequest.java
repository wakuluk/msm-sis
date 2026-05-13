package com.msm.sis.api.dto.registration;

import java.math.BigDecimal;
import java.util.List;

public record RegistrationGroupGenerationCreateRequest(
        String name,
        Long academicYearId,
        Long termId,
        String studentSearchText,
        String programSearchText,
        String groupNamePrefix,
        Long academicDivisionId,
        List<Long> academicDivisionIds,
        String honorsFilter,
        String athleteFilter,
        List<Long> athleticSportIds,
        String existingGroupFilter,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean includeCurrentCredits,
        boolean includeTransferCredits,
        Integer splitCount,
        Integer matchedStudentCount,
        List<RegistrationGroupGenerationCreateGroupRequest> groups
) {
}
