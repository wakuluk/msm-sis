package com.msm.sis.api.dto.student.program.request;

import java.util.List;

public record StudentProgramRequestQueueResponse(
        List<ProgramRequestDepartmentScopeResponse> departments,
        ProgramRequestQueueSummaryResponse summary,
        ProgramRequestQueuePageResponse page,
        List<StudentProgramRequestSummaryResponse> requests
) {
}
