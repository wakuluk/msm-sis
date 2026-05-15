package com.msm.sis.api.dto.transfer;

import java.math.BigDecimal;

public record TransferRequestMappingComparisonCourseResponse(
        Long transferRequestCourseId,
        String externalSubjectCode,
        String externalCourseNumber,
        String externalCourseTitle,
        String externalCourseDescription,
        BigDecimal requestedCredits
) {
}
