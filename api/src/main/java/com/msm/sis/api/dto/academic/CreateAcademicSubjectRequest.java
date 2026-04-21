package com.msm.sis.api.dto.academic;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAcademicSubjectRequest(

        @NotBlank
        @Size(max = 20)
        String code,

        @NotBlank
        @Size(max = 255)
        String name
) {
}
