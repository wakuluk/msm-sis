package com.msm.sis.api.dto.academic.term;

import jakarta.validation.constraints.NotNull;

public record ShiftAcademicSubTermStatusRequest(
        @NotNull
        AcademicSubTermStatusShiftDirection direction
) {
}
