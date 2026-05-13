package com.msm.sis.api.dto.registration;

import java.util.List;

public record UnassignedRegistrationGroupStudentSearchResponse(
        RegistrationGroupSearchPageResponse page,
        long unassignedStudentCount,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        List<UnassignedRegistrationGroupStudentResponse> results
) {
}
