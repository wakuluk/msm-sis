package com.msm.sis.api.dto.student.affiliation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddStudentAthleteRequest(
        @NotNull
        @Positive
        Long athleticSportId,

        @NotNull
        Boolean active
) {
}
