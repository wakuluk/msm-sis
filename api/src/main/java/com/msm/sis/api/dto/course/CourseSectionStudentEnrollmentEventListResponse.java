package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSectionStudentEnrollmentEventListResponse(
        Long sectionId,
        Long enrollmentId,
        List<CourseSectionStudentEnrollmentEventResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
