package com.msm.sis.api.dto.registration;

import java.math.BigDecimal;
import java.util.List;

public record UnassignedRegistrationGroupStudentResponse(
        Long studentId,
        String studentNumber,
        String firstName,
        String lastName,
        String displayName,
        String email,
        String academicDivisionCode,
        String academicDivisionName,
        Long classStandingId,
        String classStandingName,
        List<String> programNames,
        boolean honors,
        List<CodeNameRegistrationOptionResponse> athleticSports,
        BigDecimal completedCredits,
        BigDecimal currentCredits,
        BigDecimal transferCredits,
        BigDecimal totalCredits
) {
}
