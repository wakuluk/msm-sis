package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseVersionSearchResponse(
        Long courseId,
        Long subjectId,
        String subjectCode,
        String courseNumber,
        String courseCode,
        List<CourseVersionDetailResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
