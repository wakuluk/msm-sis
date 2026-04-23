package com.msm.sis.api.dto.academic;

public record AcademicSubTermReferenceOptionResponse(
        Long id,
        String code,
        String name,
        Long academicYearId,
        String academicYearCode,
        String academicYearName
) {
}
