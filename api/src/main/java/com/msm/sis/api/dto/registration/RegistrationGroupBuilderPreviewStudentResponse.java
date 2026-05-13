package com.msm.sis.api.dto.registration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RegistrationGroupBuilderPreviewStudentResponse(
        Long studentId,
        String studentNumber,
        String firstName,
        String lastName,
        String displayName,
        String email,
        Long academicDivisionId,
        String academicDivisionCode,
        String academicDivisionName,
        Integer classStandingId,
        String classStandingName,
        LocalDate estimatedGradDate,
        List<String> programNames,
        boolean honors,
        List<CodeNameRegistrationOptionResponse> athleticSports,
        BigDecimal completedCredits,
        BigDecimal currentCredits,
        BigDecimal transferCredits,
        BigDecimal totalCredits,
        RegistrationGroupExistingAssignmentResponse existingAssignment
) {
}
