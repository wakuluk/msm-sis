package com.msm.sis.api.service.student;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record StudentRequirementEvaluationResult(
        BigDecimal completed,
        BigDecimal planned,
        BigDecimal required,
        String progressUnit,
        Map<Long, StudentRequirementCourseEvaluation> courseEvaluations,
        List<StudentRequirementMatchedCourse> matchedCourses
) {
}
