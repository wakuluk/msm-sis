package com.msm.sis.api.dto.student.program.request;

import com.msm.sis.api.dto.student.program.StudentProgramsResponse;

import java.util.List;

public record StudentProgramReviewDetailResponse(
        StudentProgramReviewSummaryResponse studentProgram,
        StudentProgramRequestSummaryResponse request,
        List<ProgramRequestProgramVersionOptionResponse> programVersions,
        StudentProgramsResponse plan
) {
}
