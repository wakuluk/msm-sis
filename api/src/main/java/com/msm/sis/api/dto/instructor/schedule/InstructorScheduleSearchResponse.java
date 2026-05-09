package com.msm.sis.api.dto.instructor.schedule;

import java.util.List;

public record InstructorScheduleSearchResponse(
        InstructorScheduleSearchPageResponse page,
        List<InstructorScheduleSearchResultResponse> results
) {
}
