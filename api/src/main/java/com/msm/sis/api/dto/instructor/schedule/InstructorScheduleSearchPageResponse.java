package com.msm.sis.api.dto.instructor.schedule;

public record InstructorScheduleSearchPageResponse(
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
