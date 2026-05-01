package com.msm.sis.api.dto.program;

public record RequirementCourseResponse(
        Long requirementCourseId,
        Long courseId,
        String subjectCode,
        String courseNumber,
        boolean required,
        String minimumGrade
) {
}
