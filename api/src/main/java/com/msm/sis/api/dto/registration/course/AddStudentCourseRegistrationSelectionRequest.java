package com.msm.sis.api.dto.registration.course;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AddStudentCourseRegistrationSelectionRequest(
        @NotNull
        Long sectionId,

        Long gradingBasisId,

        @Size(max = 50)
        String gradingBasisCode,

        @DecimalMin("0.00")
        BigDecimal selectedCredits
) {
}
