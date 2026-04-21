package com.msm.sis.api.dto.academic;

public record AcademicDepartmentSubjectResponse(
        Long subjectId,
        String code,
        String name,
        boolean active
) {
}
