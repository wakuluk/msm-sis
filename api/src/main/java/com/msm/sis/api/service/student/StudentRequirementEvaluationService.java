package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class StudentRequirementEvaluationService {
    private final List<RequirementEvaluator> requirementEvaluators;
    private final RequirementCourseStatusEvaluator courseStatusEvaluator;

    public StudentRequirementEvaluationService(
            List<RequirementEvaluator> requirementEvaluators,
            RequirementCourseStatusEvaluator courseStatusEvaluator
    ) {
        this.requirementEvaluators = requirementEvaluators.stream()
                .sorted(Comparator.comparing(this::fallbackLast))
                .toList();
        this.courseStatusEvaluator = courseStatusEvaluator;
    }

    public StudentRequirementEvaluationResult evaluate(
            Requirement requirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules,
            List<StudentCourseEvidence> completedEvidence,
            List<StudentAcademicPlanCourse> plannedCourses
    ) {
        return evaluate(
                requirement,
                requirementCourses,
                requirementCourseRules,
                completedEvidence,
                plannedCourses,
                new StudentCompletionRequirementClaimTracker()
        );
    }

    public StudentRequirementEvaluationResult evaluate(
            Requirement requirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules,
            List<StudentCourseEvidence> completedEvidence,
            List<StudentAcademicPlanCourse> plannedCourses,
            StudentCompletionRequirementClaimTracker claimTracker
    ) {
        StudentRequirementEvaluationContext context = StudentRequirementEvaluationContext.from(
                requirement,
                requirementCourses,
                requirementCourseRules,
                claimTracker.availableCompletedEvidence(completedEvidence),
                claimTracker.availablePlannedCourses(plannedCourses)
        );
        var courseEvaluations = courseStatusEvaluator.evaluate(context);

        StudentRequirementEvaluationResult result = requirementEvaluators.stream()
                .filter(evaluator -> evaluator.supports(context))
                .findFirst()
                .orElseThrow()
                .evaluate(context, courseEvaluations);
        claimTracker.claim(result);
        return result;
    }

    private int fallbackLast(RequirementEvaluator evaluator) {
        return evaluator instanceof FallbackRequirementEvaluator ? 1 : 0;
    }
}
