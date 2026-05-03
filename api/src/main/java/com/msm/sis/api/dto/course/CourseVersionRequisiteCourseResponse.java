package com.msm.sis.api.dto.course;

public record CourseVersionRequisiteCourseResponse(
        Long courseVersionRequisiteCourseId,
        Long courseId,
        Long subjectId,
        String subjectCode,
        String courseNumber,
        String courseCode,
        boolean lab,
        Integer sortOrder
) {
}
