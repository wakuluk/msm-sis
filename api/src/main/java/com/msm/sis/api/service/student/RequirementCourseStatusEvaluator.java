package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class RequirementCourseStatusEvaluator {

    public Map<Long, StudentRequirementCourseEvaluation> evaluate(
            StudentRequirementEvaluationContext context
    ) {
        Map<Long, StudentRequirementCourseEvaluation> evaluations = new LinkedHashMap<>();
        for (RequirementCourse requirementCourse : context.requirementCourses()) {
            Course course = requirementCourse.getCourse();
            if (course == null) {
                continue;
            }

            evaluations.put(course.getId(), evaluateCourse(course.getId(), context));
        }

        return evaluations;
    }

    private StudentRequirementCourseEvaluation evaluateCourse(
            Long courseId,
            StudentRequirementEvaluationContext context
    ) {
        StudentCourseEvidence completed = context.completedEvidenceByCourseId().getOrDefault(courseId, List.of())
                .stream()
                .min(Comparator.comparing(
                        StudentCourseEvidence::completedDate,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .orElse(null);
        if (completed != null) {
            return new StudentRequirementCourseEvaluation(
                    "complete",
                    completed.source(),
                    completed.sourceRecordId(),
                    null
            );
        }

        StudentAcademicPlanCourse planned = context.plannedCoursesByCourseId().getOrDefault(courseId, List.of())
                .stream()
                .min(Comparator.comparing(
                        StudentAcademicPlanCourse::getSortOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .orElse(null);
        if (planned != null) {
            return new StudentRequirementCourseEvaluation(
                    "planned",
                    null,
                    null,
                    planned.getId()
            );
        }

        return StudentRequirementCourseEvaluation.needed();
    }
}
