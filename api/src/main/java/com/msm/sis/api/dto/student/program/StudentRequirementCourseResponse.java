package com.msm.sis.api.dto.student.program;

import java.math.BigDecimal;
import java.util.List;

public record StudentRequirementCourseResponse(
        Long courseId,
        String subjectCode,
        String courseNumber,
        String courseCode,
        String title,
        BigDecimal credits,
        String status,
        String evidenceType,
        Long evidenceId,
        Long plannedCourseId,
        List<String> warnings
) {
}
