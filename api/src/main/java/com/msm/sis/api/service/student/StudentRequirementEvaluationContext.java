package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record StudentRequirementEvaluationContext(
        Requirement requirement,
        List<RequirementCourse> requirementCourses,
        List<RequirementCourseRule> requirementCourseRules,
        List<StudentCourseEvidence> completedEvidence,
        List<StudentAcademicPlanCourse> plannedCourses,
        Map<Long, List<StudentCourseEvidence>> completedEvidenceByCourseId,
        Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByCourseId
) {
    public static StudentRequirementEvaluationContext from(
            Requirement requirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules,
            List<StudentCourseEvidence> completedEvidence,
            List<StudentAcademicPlanCourse> plannedCourses
    ) {
        return new StudentRequirementEvaluationContext(
                requirement,
                List.copyOf(requirementCourses),
                List.copyOf(requirementCourseRules),
                List.copyOf(completedEvidence),
                List.copyOf(plannedCourses),
                completedEvidence.stream().collect(Collectors.groupingBy(StudentCourseEvidence::courseId)),
                plannedCourses.stream()
                        .filter(plannedCourse -> plannedCourse.getCourse() != null)
                        .collect(Collectors.groupingBy(plannedCourse -> plannedCourse.getCourse().getId()))
        );
    }
}
