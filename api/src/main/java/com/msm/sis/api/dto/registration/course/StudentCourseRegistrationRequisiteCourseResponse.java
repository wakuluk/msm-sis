package com.msm.sis.api.dto.registration.course;

public record StudentCourseRegistrationRequisiteCourseResponse(
        Long courseVersionRequisiteCourseId,
        Long requiredCourseId,
        String requiredCourseCode,
        boolean requiredCourseLab,
        String minimumGrade,
        String studentEvidence,
        String status
) {
}
