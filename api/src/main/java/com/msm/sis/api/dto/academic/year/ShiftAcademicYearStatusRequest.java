package com.msm.sis.api.dto.academic.year;

import jakarta.validation.constraints.NotNull;

public record ShiftAcademicYearStatusRequest(
        @NotNull
        AcademicYearStatusShiftDirection direction
) {
}
