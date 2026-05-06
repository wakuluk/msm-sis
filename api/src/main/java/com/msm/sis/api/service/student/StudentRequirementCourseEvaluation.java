package com.msm.sis.api.service.student;

public record StudentRequirementCourseEvaluation(
        String status,
        String evidenceType,
        Long evidenceId,
        Long plannedCourseId
) {
    public static StudentRequirementCourseEvaluation needed() {
        return new StudentRequirementCourseEvaluation("needed", null, null, null);
    }
}
