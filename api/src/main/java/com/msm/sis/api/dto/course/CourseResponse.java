package com.msm.sis.api.dto.course;

public record CourseResponse(
        Long courseId,
        Long subjectId,
        String courseNumber,
        String currentVersionTitle,
        Boolean active
){
}
