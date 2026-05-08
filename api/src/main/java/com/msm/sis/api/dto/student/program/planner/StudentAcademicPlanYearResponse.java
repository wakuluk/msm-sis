package com.msm.sis.api.dto.student.program.planner;

import java.math.BigDecimal;
import java.util.List;

public record StudentAcademicPlanYearResponse(
        Long studentAcademicPlanYearId,
        String label,
        Integer sortOrder,
        boolean canRemove,
        String source,
        boolean readOnly,
        BigDecimal plannedCredits,
        List<StudentAcademicPlanTermResponse> terms
) {
}
