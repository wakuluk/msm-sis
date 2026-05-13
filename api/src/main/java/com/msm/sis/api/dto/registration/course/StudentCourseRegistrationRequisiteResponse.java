package com.msm.sis.api.dto.registration.course;

public record StudentCourseRegistrationRequisiteResponse(
        Long courseVersionRequisiteGroupId,
        Long courseVersionRequisiteCourseId,
        String requisiteType,
        String conditionType,
        Integer minimumRequired,
        Long requiredCourseId,
        String requiredCourseCode,
        boolean requiredCourseLab,
        String minimumGrade,
        String studentEvidence,
        String status
) {
}
