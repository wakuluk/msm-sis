package com.msm.sis.api.dto.academic.year;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CreateAcademicYearRequest(

        @NotBlank
        @Size(max = 20)
        String code,

        @NotBlank
        @Size(max = 100)
        String name,

        @NotNull
        LocalDate startDate,

        @NotNull
        LocalDate endDate,

        @Valid
        List<CreateAcademicYearSubTermRequest> subTerms
) {
}
