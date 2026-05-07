package com.msm.sis.api.dto.student.program.request;

public record ProgramRequestQueueSummaryResponse(
        long totalRequests,
        long requestedCount,
        long departmentApprovedCount
) {
}
