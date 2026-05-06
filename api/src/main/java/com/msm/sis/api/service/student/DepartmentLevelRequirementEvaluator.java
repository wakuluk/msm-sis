package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DepartmentLevelRequirementEvaluator implements RequirementEvaluator {
    private final RequirementProgressMath progressMath;
    private final RequirementCourseRuleMatcher ruleMatcher;
    private final StudentRequirementMatchedCourseFactory matchedCourseFactory;

    @Override
    public boolean supports(StudentRequirementEvaluationContext context) {
        return "DEPARTMENT_LEVEL_COURSES".equals(requirementType(context));
    }

    @Override
    public StudentRequirementEvaluationResult evaluate(
            StudentRequirementEvaluationContext context,
            Map<Long, StudentRequirementCourseEvaluation> courseEvaluations
    ) {
        BigDecimal completed = BigDecimal.ZERO;
        BigDecimal planned = BigDecimal.ZERO;
        BigDecimal required = progressMath.requiredValueForRequirementCourseRules(
                context.requirement(),
                context.requirementCourseRules()
        );
        String progressUnit = progressMath.progressUnit(context.requirement(), context.requirementCourseRules());
        List<StudentRequirementMatchedCourse> matchedCourses = new ArrayList<>();

        List<StudentCourseEvidence> matchingCompleted = context.requirementCourseRules().stream()
                .flatMap(rule -> context.completedEvidence().stream()
                        .filter(evidence -> ruleMatcher.matches(evidence, rule)))
                .distinct()
                .toList();
        List<StudentAcademicPlanCourse> matchingPlanned = context.requirementCourseRules().stream()
                .flatMap(rule -> context.plannedCourses().stream()
                        .filter(plannedCourse -> ruleMatcher.matches(plannedCourse, rule)))
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toMap(
                                this::plannedCourseKey,
                                java.util.function.Function.identity(),
                                (first, ignored) -> first,
                                LinkedHashMap::new
                        ),
                        map -> map.values().stream().toList()
                ));

        if ("credits".equals(progressUnit)) {
            BigDecimal remainingCompleted = required;
            for (StudentCourseEvidence evidence : matchingCompleted) {
                if (remainingCompleted.compareTo(BigDecimal.ZERO) <= 0) {
                    break;
                }
                BigDecimal credits = nullToZero(evidence.creditsEarned());
                completed = completed.add(credits);
                remainingCompleted = remainingCompleted.subtract(credits);
                matchedCourses.add(matchedCourseFactory.fromCompleted(evidence));
            }

            BigDecimal remainingPlanned = required.subtract(progressMath.cap(completed, required));
            Set<Long> completedCourseIds = matchingCompleted.stream()
                    .map(StudentCourseEvidence::courseId)
                    .filter(Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());
            for (StudentAcademicPlanCourse plannedCourse : matchingPlanned) {
                if (remainingPlanned.compareTo(BigDecimal.ZERO) <= 0) {
                    break;
                }
                Course course = plannedCourse.getCourse();
                if (course != null && completedCourseIds.contains(course.getId())) {
                    continue;
                }

                BigDecimal credits = nullToZero(plannedCourse.getCredits());
                planned = planned.add(credits);
                remainingPlanned = remainingPlanned.subtract(credits);
                matchedCourses.add(matchedCourseFactory.fromPlanned(plannedCourse));
            }
        } else {
            Set<Long> countedCourseIds = new LinkedHashSet<>();
            for (StudentCourseEvidence evidence : matchingCompleted) {
                if (completed.compareTo(required) >= 0) {
                    break;
                }
                if (evidence.courseId() == null || !countedCourseIds.add(evidence.courseId())) {
                    continue;
                }
                completed = completed.add(BigDecimal.ONE);
                matchedCourses.add(matchedCourseFactory.fromCompleted(evidence));
            }

            for (StudentAcademicPlanCourse plannedCourse : matchingPlanned) {
                if (completed.add(planned).compareTo(required) >= 0) {
                    break;
                }
                Course course = plannedCourse.getCourse();
                if (course == null || !countedCourseIds.add(course.getId())) {
                    continue;
                }
                planned = planned.add(BigDecimal.ONE);
                matchedCourses.add(matchedCourseFactory.fromPlanned(plannedCourse));
            }
        }

        BigDecimal cappedCompleted = progressMath.cap(completed, required);

        return new StudentRequirementEvaluationResult(
                cappedCompleted,
                progressMath.cap(planned, required.subtract(cappedCompleted)),
                required,
                progressUnit,
                Map.of(),
                matchedCourseFactory.sort(matchedCourses)
        );
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return Objects.requireNonNullElse(value, BigDecimal.ZERO);
    }

    private String plannedCourseKey(StudentAcademicPlanCourse plannedCourse) {
        if (plannedCourse.getId() != null) {
            return "id:" + plannedCourse.getId();
        }

        Course course = plannedCourse.getCourse();
        return "draft:"
                + System.identityHashCode(plannedCourse)
                + ":"
                + (course == null ? "placeholder" : course.getId());
    }
}
