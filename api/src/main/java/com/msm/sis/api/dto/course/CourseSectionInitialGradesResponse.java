package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseSectionInitialGradesResponse(
        Long sectionId,
        List<CourseSectionStudentResponse> results
) {
}
