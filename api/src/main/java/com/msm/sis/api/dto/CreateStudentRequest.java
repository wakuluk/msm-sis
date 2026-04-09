package com.msm.sis.api.dto;

import java.time.LocalDate;

public record CreateStudentRequest(
        String lastName,
        String firstName,
        String middleName,
        String nameSuffix,
        Integer genderId,
        Integer ethnicityId,
        Integer classStandingId,
        String preferredName,
        LocalDate dateOfBirth,
        LocalDate estimatedGradDate,
        String altId,
        String email,
        String phone,
        String addressLine1,
        String addressLine2,
        String city,
        String stateRegion,
        String postalCode,
        String countryCode,
        String addressType
) {
}
