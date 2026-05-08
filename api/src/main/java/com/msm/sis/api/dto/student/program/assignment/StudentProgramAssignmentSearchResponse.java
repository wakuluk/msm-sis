package com.msm.sis.api.dto.student.program.assignment;

import java.util.List;

public record StudentProgramAssignmentSearchResponse(
        StudentProgramAssignmentSearchPageResponse page,
        List<StudentProgramAssignmentSearchResultResponse> results
) {
}
