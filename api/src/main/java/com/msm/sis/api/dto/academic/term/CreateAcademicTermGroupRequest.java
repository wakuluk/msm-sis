package com.msm.sis.api.dto.academic.term;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CreateAcademicTermGroupRequest(

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

        List<Long> termIds
) {
}
