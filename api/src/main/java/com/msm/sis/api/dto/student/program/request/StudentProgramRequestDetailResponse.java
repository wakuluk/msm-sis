package com.msm.sis.api.dto.student.program.request;

import com.msm.sis.api.dto.student.program.StudentProgramsResponse;

import java.util.List;

public record StudentProgramRequestDetailResponse(
        StudentProgramRequestSummaryResponse request,
        List<ProgramRequestProgramVersionOptionResponse> programVersions,
        StudentProgramsResponse plan
) {
}
