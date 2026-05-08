package com.msm.sis.api.dto.student.program.planner;

import java.util.List;

public record StudentAcademicPlanResponse(
        Long studentAcademicPlanId,
        String name,
        boolean active,
        List<StudentAcademicPlanYearResponse> years
) {
}
