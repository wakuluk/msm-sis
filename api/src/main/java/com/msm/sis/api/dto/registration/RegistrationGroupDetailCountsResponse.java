package com.msm.sis.api.dto.registration;

public record RegistrationGroupDetailCountsResponse(
        long assignedStudentCount,
        Integer matchedStudentCount,
        Integer splitCount
) {
}
