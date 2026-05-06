package com.msm.sis.api.dto.student.program.planner;

import java.math.BigDecimal;
import java.util.List;

public record StudentAcademicPlanTermResponse(
        Long studentAcademicPlanTermId,
        String label,
        Integer sortOrder,
        boolean complete,
        String source,
        boolean readOnly,
        BigDecimal plannedCredits,
        List<StudentAcademicPlanCourseResponse> courses
) {
}
