package com.msm.sis.api.dto.student.program.planner;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

public record StudentAcademicPlanDraftTermRequest(
        Long studentAcademicPlanTermId,

        @NotBlank
        @Size(max = 100)
        String label,

        @NotNull
        @PositiveOrZero
        Integer sortOrder,

        boolean complete,

        @NotNull
        @Valid
        List<StudentAcademicPlanDraftCourseRequest> courses
) {
}
