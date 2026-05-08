package com.msm.sis.api.service.student;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class FallbackRequirementEvaluator implements RequirementEvaluator {
    private final RequirementProgressMath progressMath;

    @Override
    public boolean supports(StudentRequirementEvaluationContext context) {
        return true;
    }

    @Override
    public StudentRequirementEvaluationResult evaluate(
            StudentRequirementEvaluationContext context,
            Map<Long, StudentRequirementCourseEvaluation> courseEvaluations
    ) {
        return new StudentRequirementEvaluationResult(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                progressMath.requiredValue(context.requirement()),
                progressMath.progressUnit(context.requirement()),
                courseEvaluations,
                java.util.List.of()
        );
    }
}
