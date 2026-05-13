package com.msm.sis.api.dto.registration;

import java.time.LocalDate;
import java.util.List;

public record RegistrationGroupAcademicYearOptionResponse(
        Long id,
        String code,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        List<RegistrationGroupTermOptionResponse> terms
) {
}
