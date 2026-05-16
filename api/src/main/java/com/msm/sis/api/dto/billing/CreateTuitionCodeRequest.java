package com.msm.sis.api.dto.billing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTuitionCodeRequest(
        @NotBlank(message = "Code is required.")
        @Size(max = 32, message = "Code must be 32 characters or fewer.")
        String code,

        @NotBlank(message = "Name is required.")
        @Size(max = 255, message = "Name must be 255 characters or fewer.")
        String name
) {
}

