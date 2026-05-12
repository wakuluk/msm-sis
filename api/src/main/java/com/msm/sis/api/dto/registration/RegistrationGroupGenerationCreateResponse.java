package com.msm.sis.api.dto.registration;

import java.util.List;

public record RegistrationGroupGenerationCreateResponse(
        Long registrationGroupGenerationId,
        String name,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        int matchedStudentCount,
        int splitCount,
        int groupCount,
        List<RegistrationGroupGenerationCreatedGroupResponse> groups
) {
}
