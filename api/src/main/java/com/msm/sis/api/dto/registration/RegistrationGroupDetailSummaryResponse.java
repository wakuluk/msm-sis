package com.msm.sis.api.dto.registration;

public record RegistrationGroupDetailSummaryResponse(
        Long registrationGroupId,
        String name,
        String statusCode,
        String statusName,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        Long generationId,
        String generationName
) {
}
