package com.msm.sis.api.dto.student.program.request;

public record ProgramRequestQueuePageResponse(
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
