package com.msm.sis.api.dto.student;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateStudentRequest(
        @NotBlank(message = "Last name is required.")
        @Size(max = 50, message = "Last name must be 50 characters or fewer.")
        String lastName,

        @NotBlank(message = "First name is required.")
        @Size(max = 50, message = "First name must be 50 characters or fewer.")
        String firstName,

        @Size(max = 50, message = "Middle name must be 50 characters or fewer.")
        String middleName,

        @Size(max = 10, message = "Name suffix must be 10 characters or fewer.")
        String nameSuffix,

        Integer genderId,
        Integer ethnicityId,
        Integer classStandingId,

        @Size(max = 255, message = "Preferred name must be 255 characters or fewer.")
        String preferredName,

        @PastOrPresent(message = "Date of birth cannot be in the future.")
        LocalDate dateOfBirth,
        LocalDate estimatedGradDate,

        @Size(max = 50, message = "Alt ID must be 50 characters or fewer.")
        String altId,

        @Email(message = "Email must be a valid email address.")
        @Size(max = 255, message = "Email must be 255 characters or fewer.")
        String email,

        @Size(max = 30, message = "Phone must be 30 characters or fewer.")
        String phone,

        @Size(max = 255, message = "Address line 1 must be 255 characters or fewer.")
        String addressLine1,

        @Size(max = 255, message = "Address line 2 must be 255 characters or fewer.")
        String addressLine2,

        @Size(max = 100, message = "City must be 100 characters or fewer.")
        String city,

        @Size(max = 100, message = "State/region must be 100 characters or fewer.")
        String stateRegion,

        @Size(max = 20, message = "Postal code must be 20 characters or fewer.")
        String postalCode,

        @Size(max = 2, message = "Country code must be 2 characters or fewer.")
        String countryCode
) {
}
