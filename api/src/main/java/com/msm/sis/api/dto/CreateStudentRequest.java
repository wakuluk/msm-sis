package com.msm.sis.api.dto;

import java.time.LocalDate;

public record CreateStudentRequest(
        String lastName,
        String firstName,
        String middleName,
        String nameSuffix,
        String gender,
        Integer ethnicityId,
        String preferredName,
        LocalDate dateOfBirth,
        LocalDate estimatedGradDate,
        String altId,
        String email,
        String phone
) {
}
