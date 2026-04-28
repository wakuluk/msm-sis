package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AddCourseSectionStudentRequest(
        @NotNull
        Long studentId,

        @Size(max = 50)
        String statusCode,

        @Size(max = 50)
        String gradingBasisCode,

        @DecimalMin("0.00")
        BigDecimal creditsAttempted,

        Boolean includeInGpa,

        Boolean capacityOverride,

        @Size(max = 500)
        String manualAddReason
) {
}
