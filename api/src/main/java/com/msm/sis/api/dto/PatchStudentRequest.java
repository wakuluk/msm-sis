package com.msm.sis.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.openapitools.jackson.nullable.JsonNullable;

import java.time.LocalDate;

public record PatchStudentRequest(
        JsonNullable<Long> userId,
        JsonNullable<String> lastName,
        JsonNullable<String> firstName,
        JsonNullable<String> middleName,
        JsonNullable<String> nameSuffix,
        JsonNullable<String> gender,
        JsonNullable<Integer> ethnicityId,
        JsonNullable<Integer> classStandingId,
        JsonNullable<String> preferredName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        JsonNullable<LocalDate> dateOfBirth,
        @JsonFormat(pattern = "yyyy-MM-dd")
        JsonNullable<LocalDate> estimatedGradDate,
        JsonNullable<String> altId,
        JsonNullable<String> email,
        JsonNullable<String> phone,
        JsonNullable<Boolean> disabled,
        JsonNullable<String> addressLine1,
        JsonNullable<String> addressLine2,
        JsonNullable<String> city,
        JsonNullable<String> stateRegion,
        JsonNullable<String> postalCode,
        JsonNullable<String> countryCode
) {
    public PatchStudentRequest {
        userId = undefinedIfNull(userId);
        lastName = undefinedIfNull(lastName);
        firstName = undefinedIfNull(firstName);
        middleName = undefinedIfNull(middleName);
        nameSuffix = undefinedIfNull(nameSuffix);
        gender = undefinedIfNull(gender);
        ethnicityId = undefinedIfNull(ethnicityId);
        classStandingId = undefinedIfNull(classStandingId);
        preferredName = undefinedIfNull(preferredName);
        dateOfBirth = undefinedIfNull(dateOfBirth);
        estimatedGradDate = undefinedIfNull(estimatedGradDate);
        altId = undefinedIfNull(altId);
        email = undefinedIfNull(email);
        phone = undefinedIfNull(phone);
        disabled = undefinedIfNull(disabled);
        addressLine1 = undefinedIfNull(addressLine1);
        addressLine2 = undefinedIfNull(addressLine2);
        city = undefinedIfNull(city);
        stateRegion = undefinedIfNull(stateRegion);
        postalCode = undefinedIfNull(postalCode);
        countryCode = undefinedIfNull(countryCode);
    }

    private static <T> JsonNullable<T> undefinedIfNull(JsonNullable<T> value) {
        return value == null ? JsonNullable.undefined() : value;
    }
}
