package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class SpecificCourseRequirementEvaluator implements RequirementEvaluator {
    private final RequirementProgressMath progressMath;
    private final StudentRequirementMatchedCourseFactory matchedCourseFactory;

    @Override
    public boolean supports(StudentRequirementEvaluationContext context) {
        return "SPECIFIC_COURSES".equals(requirementType(context));
    }

    @Override
    public StudentRequirementEvaluationResult evaluate(
            StudentRequirementEvaluationContext context,
            Map<Long, StudentRequirementCourseEvaluation> courseEvaluations
    ) {
        BigDecimal completed = BigDecimal.ZERO;
        BigDecimal planned = BigDecimal.ZERO;
        String progressUnit = progressMath.progressUnit(context.requirement());
        List<StudentRequirementMatchedCourse> matchedCourses = new ArrayList<>();
        BigDecimal required = progressMath.requiredValueForRequirementCourses(
                context.requirement(),
                context.requirementCourses()
        );
        BigDecimal remainingCompleted = required;
        BigDecimal remainingPlanned;

        for (RequirementCourse requirementCourse : context.requirementCourses()) {
            Course course = requirementCourse.getCourse();
            if (course == null || remainingCompleted.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            List<StudentCourseEvidence> completedEvidence =
                    context.completedEvidenceByCourseId().getOrDefault(course.getId(), List.of());

            if ("credits".equals(progressUnit)) {
                for (StudentCourseEvidence evidence : completedEvidence) {
                    if (remainingCompleted.compareTo(BigDecimal.ZERO) <= 0) {
                        break;
                    }
                    BigDecimal credits = nullToZero(evidence.creditsEarned());
                    completed = completed.add(credits);
                    remainingCompleted = remainingCompleted.subtract(credits);
                    matchedCourses.add(matchedCourseFactory.fromCompleted(evidence));
                }
            } else if (!completedEvidence.isEmpty()) {
                completed = completed.add(BigDecimal.ONE);
                remainingCompleted = remainingCompleted.subtract(BigDecimal.ONE);
                matchedCourses.add(matchedCourseFactory.fromCompleted(completedEvidence.get(0)));
            }
        }

        BigDecimal cappedCompleted = progressMath.cap(completed, required);
        remainingPlanned = required.subtract(cappedCompleted);

        for (RequirementCourse requirementCourse : context.requirementCourses()) {
            Course course = requirementCourse.getCourse();
            if (course == null || remainingPlanned.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            List<StudentCourseEvidence> completedEvidence =
                    context.completedEvidenceByCourseId().getOrDefault(course.getId(), List.of());
            if (!completedEvidence.isEmpty()) {
                continue;
            }

            List<StudentAcademicPlanCourse> plannedCourses =
                    context.plannedCoursesByCourseId().getOrDefault(course.getId(), List.of());

            if ("credits".equals(progressUnit)) {
                for (StudentAcademicPlanCourse plannedCourse : plannedCourses) {
                    if (remainingPlanned.compareTo(BigDecimal.ZERO) <= 0) {
                        break;
                    }
                    BigDecimal credits = nullToZero(plannedCourse.getCredits());
                    planned = planned.add(credits);
                    remainingPlanned = remainingPlanned.subtract(credits);
                    matchedCourses.add(matchedCourseFactory.fromPlanned(plannedCourse));
                }
            } else if (!plannedCourses.isEmpty()) {
                planned = planned.add(BigDecimal.ONE);
                remainingPlanned = remainingPlanned.subtract(BigDecimal.ONE);
                matchedCourses.add(matchedCourseFactory.fromPlanned(plannedCourses.get(0)));
            }
        }

        return new StudentRequirementEvaluationResult(
                cappedCompleted,
                progressMath.cap(planned, required.subtract(cappedCompleted)),
                required,
                progressUnit,
                courseEvaluations,
                matchedCourseFactory.sort(matchedCourses)
        );
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return Objects.requireNonNullElse(value, BigDecimal.ZERO);
    }
}
