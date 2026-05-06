package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.StudentAcademicPlanCourse;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class StudentCompletionRequirementClaimTracker {
    private static final String SOURCE_PLAN = "PLAN";

    private final Set<StudentCourseEvidenceClaimKey> completedClaims = new HashSet<>();
    private final Set<Long> plannedCourseClaims = new HashSet<>();

    public List<StudentCourseEvidence> availableCompletedEvidence(List<StudentCourseEvidence> completedEvidence) {
        return completedEvidence.stream()
                .filter(evidence -> !completedClaims.contains(StudentCourseEvidenceClaimKey.from(evidence)))
                .toList();
    }

    public List<StudentAcademicPlanCourse> availablePlannedCourses(List<StudentAcademicPlanCourse> plannedCourses) {
        return plannedCourses.stream()
                .filter(plannedCourse -> plannedCourse.getId() == null || !plannedCourseClaims.contains(plannedCourse.getId()))
                .toList();
    }

    public void claim(StudentRequirementEvaluationResult evaluationResult) {
        evaluationResult.matchedCourses().forEach(matchedCourse -> {
            if (SOURCE_PLAN.equals(matchedCourse.source())) {
                if (matchedCourse.plannedCourseId() != null) {
                    plannedCourseClaims.add(matchedCourse.plannedCourseId());
                }
                return;
            }

            completedClaims.add(StudentCourseEvidenceClaimKey.from(matchedCourse));
        });
    }
}
