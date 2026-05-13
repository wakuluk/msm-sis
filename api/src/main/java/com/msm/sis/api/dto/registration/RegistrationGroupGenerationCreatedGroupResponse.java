package com.msm.sis.api.dto.registration;

import java.time.LocalDateTime;

public record RegistrationGroupGenerationCreatedGroupResponse(
        Long registrationGroupId,
        String temporaryGroupId,
        String name,
        String statusCode,
        String statusName,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        LocalDateTime registrationOpensAt,
        LocalDateTime registrationClosesAt,
        int sortOrder,
        int studentCount
) {
}
