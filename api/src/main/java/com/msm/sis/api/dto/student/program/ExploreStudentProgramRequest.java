package com.msm.sis.api.dto.student.program;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ExploreStudentProgramRequest(
        @NotNull
        @Positive
        Long programId
) {
}
