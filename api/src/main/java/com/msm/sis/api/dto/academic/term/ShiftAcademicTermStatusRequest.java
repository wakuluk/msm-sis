package com.msm.sis.api.dto.academic.term;

import jakarta.validation.constraints.NotNull;

public record ShiftAcademicTermStatusRequest(
        @NotNull
        AcademicTermStatusShiftDirection direction
) {
}
