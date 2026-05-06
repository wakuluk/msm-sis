package com.msm.sis.api.dto.student.program.planner;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record StudentAcademicPlanDraftRequest(
        Long studentAcademicPlanId,

        @NotBlank
        @Size(max = 255)
        String name,

        @NotNull
        @Valid
        List<StudentAcademicPlanDraftYearRequest> years
) {
}
