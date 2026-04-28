package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSectionStudentListResponse(
        Long sectionId,
        List<CourseSectionStudentResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
