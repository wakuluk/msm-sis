package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
@RequiredArgsConstructor
public class RequirementCourseRuleMatcher {
    private final CourseNumberParser courseNumberParser;

    public boolean matches(StudentCourseEvidence evidence, RequirementCourseRule rule) {
        if (evidence == null || rule == null || rule.getDepartment() == null) {
            return false;
        }

        return Objects.equals(evidence.departmentId(), rule.getDepartment().getId())
                && courseNumberWithinRange(evidence.courseNumber(), rule);
    }

    public boolean matches(StudentAcademicPlanCourse plannedCourse, RequirementCourseRule rule) {
        if (plannedCourse == null || rule == null || rule.getDepartment() == null) {
            return false;
        }

        Course course = plannedCourse.getCourse();
        if (course != null) {
            if (course.getSubject() == null) {
                return false;
            }

            return Objects.equals(course.getSubject().getDepartment().getId(), rule.getDepartment().getId())
                    && courseNumberWithinRange(course.getCourseNumber(), rule);
        }

        return Objects.equals(
                plannedCourse.getPlaceholderDepartment() == null ? null : plannedCourse.getPlaceholderDepartment().getId(),
                rule.getDepartment().getId()
        ) && placeholderCourseNumberWithinRange(plannedCourse, rule);
    }

    private boolean placeholderCourseNumberWithinRange(
            StudentAcademicPlanCourse plannedCourse,
            RequirementCourseRule rule
    ) {
        Integer minimumCourseNumber = plannedCourse.getPlaceholderMinimumCourseNumber();
        Integer maximumCourseNumber = plannedCourse.getPlaceholderMaximumCourseNumber();

        if (minimumCourseNumber == null) {
            return false;
        }
        if (rule.getMinimumCourseNumber() != null && minimumCourseNumber < rule.getMinimumCourseNumber()) {
            return false;
        }
        if (rule.getMaximumCourseNumber() == null) {
            return true;
        }

        return maximumCourseNumber == null || maximumCourseNumber <= rule.getMaximumCourseNumber();
    }

    private boolean courseNumberWithinRange(String courseNumber, RequirementCourseRule rule) {
        Integer numericCourseNumber = courseNumberParser.parse(courseNumber);
        if (numericCourseNumber == null) {
            return false;
        }

        if (rule.getMinimumCourseNumber() != null && numericCourseNumber < rule.getMinimumCourseNumber()) {
            return false;
        }

        return rule.getMaximumCourseNumber() == null || numericCourseNumber <= rule.getMaximumCourseNumber();
    }
}
