package com.msm.sis.api.dto.student;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record StudentProfileResponse(
        Long studentId,
        String lastName,
        String firstName,
        String middleName,
        String nameSuffix,
        String fullName,
        String gender,
        Integer ethnicityId,
        String ethnicity,
        Integer classStandingId,
        String classStanding,
        Long addressId,
        String preferredName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate dateOfBirth,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate estimatedGradDate,
        Integer classOf,
        String email,
        String phone,
        String addressLine1,
        String addressLine2,
        String city,
        String stateRegion,
        String postalCode,
        String countryCode
) {
}
