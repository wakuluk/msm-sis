package com.msm.sis.api.dto.student.academiccareer;

import java.util.List;

public record AcademicCareerOptionResponse(
        Long academicCareerId,
        String code,
        String name,
        boolean active,
        List<AcademicCareerRegistrationDivisionResponse> registrationDivisions
) {
}
