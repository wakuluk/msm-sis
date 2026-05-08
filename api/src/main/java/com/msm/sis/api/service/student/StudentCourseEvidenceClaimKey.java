package com.msm.sis.api.service.student;

public record StudentCourseEvidenceClaimKey(
        Long courseId,
        String source,
        Long sourceRecordId
) {
    public static StudentCourseEvidenceClaimKey from(StudentCourseEvidence evidence) {
        return new StudentCourseEvidenceClaimKey(
                evidence.courseId(),
                evidence.source(),
                evidence.sourceRecordId()
        );
    }

    public static StudentCourseEvidenceClaimKey from(StudentRequirementMatchedCourse matchedCourse) {
        return new StudentCourseEvidenceClaimKey(
                matchedCourse.courseId(),
                matchedCourse.source(),
                matchedCourse.sourceRecordId()
        );
    }
}
