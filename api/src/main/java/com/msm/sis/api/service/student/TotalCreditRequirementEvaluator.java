package com.msm.sis.api.service.student;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class TotalCreditRequirementEvaluator implements RequirementEvaluator {
    private final RequirementProgressMath progressMath;
    private final StudentRequirementMatchedCourseFactory matchedCourseFactory;

    @Override
    public boolean supports(StudentRequirementEvaluationContext context) {
        return "TOTAL_ELECTIVE_CREDITS".equals(requirementType(context));
    }

    @Override
    public StudentRequirementEvaluationResult evaluate(
            StudentRequirementEvaluationContext context,
            Map<Long, StudentRequirementCourseEvaluation> courseEvaluations
    ) {
        BigDecimal required = progressMath.requiredValue(context.requirement());
        BigDecimal completed = BigDecimal.ZERO;
        BigDecimal planned = BigDecimal.ZERO;
        List<StudentRequirementMatchedCourse> matchedCourses = new ArrayList<>();

        BigDecimal remainingCompleted = required;
        for (StudentCourseEvidence evidence : context.completedEvidence()) {
            if (remainingCompleted.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal credits = nullToZero(evidence.creditsEarned());
            completed = completed.add(credits);
            remainingCompleted = remainingCompleted.subtract(credits);
            matchedCourses.add(matchedCourseFactory.fromCompleted(evidence));
        }

        BigDecimal cappedCompleted = progressMath.cap(completed, required);
        BigDecimal remainingPlanned = required.subtract(cappedCompleted);
        for (var plannedCourse : context.plannedCourses()) {
            if (remainingPlanned.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal credits = nullToZero(plannedCourse.getCredits());
            planned = planned.add(credits);
            remainingPlanned = remainingPlanned.subtract(credits);
            matchedCourses.add(matchedCourseFactory.fromPlanned(plannedCourse));
        }

        return new StudentRequirementEvaluationResult(
                cappedCompleted,
                progressMath.cap(planned, required.subtract(cappedCompleted)),
                required,
                "credits",
                Map.of(),
                matchedCourseFactory.sort(matchedCourses)
        );
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return Objects.requireNonNullElse(value, BigDecimal.ZERO);
    }
}
