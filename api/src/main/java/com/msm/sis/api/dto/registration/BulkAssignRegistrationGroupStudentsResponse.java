package com.msm.sis.api.dto.registration;

import java.util.List;

public record BulkAssignRegistrationGroupStudentsResponse(
        Long registrationGroupId,
        String registrationGroupName,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        int requestedStudentCount,
        int assignedStudentCount,
        long remainingUnassignedStudentCount,
        List<Long> assignedStudentIds
) {
}
