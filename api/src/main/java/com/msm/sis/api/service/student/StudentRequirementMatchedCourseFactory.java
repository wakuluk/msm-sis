package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import com.msm.sis.api.entity.StudentAcademicPlanTerm;
import com.msm.sis.api.entity.StudentAcademicPlanYear;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Component
public class StudentRequirementMatchedCourseFactory {
    private static final String STATUS_COMPLETED = "completed";
    private static final String STATUS_PLANNED = "planned";
    private static final String SOURCE_PLAN = "PLAN";

    public StudentRequirementMatchedCourse fromCompleted(StudentCourseEvidence evidence) {
        return new StudentRequirementMatchedCourse(
                evidence.courseId(),
                evidence.courseCode(),
                evidence.title(),
                evidence.creditsEarned(),
                STATUS_COMPLETED,
                evidence.source(),
                evidence.sourceRecordId(),
                null,
                null,
                null
        );
    }

    public List<StudentRequirementMatchedCourse> fromCompleted(List<StudentCourseEvidence> completedEvidence) {
        return completedEvidence.stream()
                .map(this::fromCompleted)
                .toList();
    }

    public StudentRequirementMatchedCourse fromPlanned(StudentAcademicPlanCourse planCourse) {
        Course course = planCourse.getCourse();
        StudentAcademicPlanTerm term = planCourse.getStudentAcademicPlanTerm();
        StudentAcademicPlanYear year = term == null ? null : term.getStudentAcademicPlanYear();

        return new StudentRequirementMatchedCourse(
                course == null ? null : course.getId(),
                course == null ? planCourse.getPlaceholderLabel() : courseCode(course),
                course == null ? planCourse.getPlaceholderLabel() : null,
                planCourse.getCredits(),
                STATUS_PLANNED,
                SOURCE_PLAN,
                planCourse.getId(),
                planCourse.getId(),
                term == null ? null : term.getLabel(),
                year == null ? null : year.getLabel()
        );
    }

    public List<StudentRequirementMatchedCourse> fromPlanned(List<StudentAcademicPlanCourse> plannedCourses) {
        return plannedCourses.stream()
                .map(this::fromPlanned)
                .toList();
    }

    public List<StudentRequirementMatchedCourse> sort(List<StudentRequirementMatchedCourse> matchedCourses) {
        return matchedCourses.stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator
                        .comparing(StudentRequirementMatchedCourse::status, Comparator.nullsLast(String::compareTo))
                        .thenComparing(StudentRequirementMatchedCourse::courseCode, Comparator.nullsLast(String::compareTo))
                        .thenComparing(StudentRequirementMatchedCourse::source, Comparator.nullsLast(String::compareTo))
                        .thenComparing(StudentRequirementMatchedCourse::sourceRecordId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    private String courseCode(Course course) {
        if (course == null) {
            return null;
        }

        AcademicSubject subject = course.getSubject();
        if (subject == null) {
            return course.getCourseNumber();
        }

        return subject.getCode() + " " + course.getCourseNumber();
    }
}
