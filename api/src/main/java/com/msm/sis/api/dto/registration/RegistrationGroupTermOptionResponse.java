package com.msm.sis.api.dto.registration;

import java.time.LocalDate;

public record RegistrationGroupTermOptionResponse(
        Long id,
        String code,
        String name,
        LocalDate startDate,
        LocalDate endDate
) {
}
