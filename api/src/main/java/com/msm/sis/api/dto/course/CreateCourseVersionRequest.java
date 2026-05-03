package com.msm.sis.api.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateCourseVersionRequest(
        @NotBlank
        @Size(max = 255)
        String title,

        String catalogDescription,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal minCredits,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal maxCredits,

        boolean variableCredit,

        @Valid
        List<CreateCourseVersionRequisiteGroupRequest> requisites
) {
}
