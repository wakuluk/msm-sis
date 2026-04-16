package com.msm.sis.api.dto.academic.year;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AcademicYearStatusResponse (
    @NotBlank
    @Size(max = 20)
    String code,

    @NotBlank
    @Size(max = 100)
    String name,

    @NotNull
    Integer order
){}
