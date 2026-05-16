package com.msm.sis.api.dto.billing;

import jakarta.validation.constraints.Positive;

public record UpdateStudentBillingAssignmentRequest(
        @Positive(message = "Tuition code id must be positive.")
        Long tuitionCodeId
) {
}

