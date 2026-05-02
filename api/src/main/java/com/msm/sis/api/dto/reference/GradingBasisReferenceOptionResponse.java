package com.msm.sis.api.dto.reference;

public record GradingBasisReferenceOptionResponse(
        Long id,
        String code,
        String name,
        boolean allowedForCourseSections,
        boolean allowedForStudentEnrollments
) {
}
