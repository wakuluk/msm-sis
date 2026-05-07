package com.msm.sis.api.dto.student.program.assignment;

public record StudentProgramAssignmentSearchPageResponse(
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
