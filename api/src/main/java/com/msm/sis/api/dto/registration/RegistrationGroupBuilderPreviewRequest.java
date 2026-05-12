package com.msm.sis.api.dto.registration;

import java.math.BigDecimal;
import java.util.List;

public record RegistrationGroupBuilderPreviewRequest(
        Long academicYearId,
        Long termId,
        String studentSearchText,
        String programSearchText,
        String groupNamePrefix,
        Long academicDivisionId,
        String honorsFilter,
        String athleteFilter,
        List<Long> athleticSportIds,
        String existingGroupFilter,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean includeCurrentCredits,
        boolean includeTransferCredits,
        Integer splitCount
) {
}
