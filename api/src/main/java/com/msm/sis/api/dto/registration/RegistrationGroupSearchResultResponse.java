package com.msm.sis.api.dto.registration;

import java.time.LocalDateTime;

public record RegistrationGroupSearchResultResponse(
        Long registrationGroupId,
        String name,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        String statusCode,
        String statusName,
        LocalDateTime registrationOpensAt,
        LocalDateTime registrationClosesAt,
        Long generationId,
        String generationName,
        String createdFrom,
        long studentCount
) {
}
