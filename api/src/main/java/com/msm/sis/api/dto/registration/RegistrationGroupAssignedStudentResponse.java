package com.msm.sis.api.dto.registration;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RegistrationGroupAssignedStudentResponse(
        Long registrationGroupStudentId,
        Long studentId,
        String studentNumber,
        String firstName,
        String lastName,
        String displayName,
        String email,
        Integer classStandingId,
        String classStandingName,
        LocalDate estimatedGradDate,
        String assignmentSource,
        LocalDateTime assignedAt,
        LocalDateTime updatedAt
) {
}
