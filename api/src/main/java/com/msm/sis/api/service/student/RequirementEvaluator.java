package com.msm.sis.api.service.student;

import java.util.Map;

public interface RequirementEvaluator {
    boolean supports(StudentRequirementEvaluationContext context);

    StudentRequirementEvaluationResult evaluate(
            StudentRequirementEvaluationContext context,
            Map<Long, StudentRequirementCourseEvaluation> courseEvaluations
    );

    default String requirementType(StudentRequirementEvaluationContext context) {
        return context.requirement() == null || context.requirement().getRequirementType() == null
                ? ""
                : context.requirement().getRequirementType().trim().toUpperCase();
    }
}
