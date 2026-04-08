package com.msm.sis.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StudentDetailResponse(
        Long studentId,
        Long userId,
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
        String altId,
        String email,
        String phone,
        boolean disabled,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime lastUpdated,
        String updatedBy,
        String addressLine1,
        String addressLine2,
        String city,
        String stateRegion,
        String postalCode,
        String countryCode,
        String addressType
) {
}
