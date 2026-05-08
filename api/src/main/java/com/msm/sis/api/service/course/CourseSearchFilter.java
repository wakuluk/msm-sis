package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseSearchCriteria;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;

import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.containsIgnoreCase;

final class CourseSearchFilter {
    private CourseSearchFilter() {
    }

    static boolean matches(
            Course course,
            CourseVersion currentCourseVersion,
            CourseSearchCriteria criteria
    ) {
        if (course == null || course.getSubject() == null || course.getSubject().getDepartment() == null) {
            return false;
        }

        if (!Boolean.TRUE.equals(criteria.getIncludeInactive()) && !course.isActive()) {
            return false;
        }

        if (criteria.getSchoolId() != null) {
            Long schoolId = course.getSubject().getDepartment().getSchool() == null
                    ? null
                    : course.getSubject().getDepartment().getSchool().getId();
            if (!Objects.equals(criteria.getSchoolId(), schoolId)) {
                return false;
            }
        }

        if (criteria.getDepartmentId() != null && !Objects.equals(criteria.getDepartmentId(), course.getSubject().getDepartment().getId())) {
            return false;
        }

        if (criteria.getSubjectId() != null && !Objects.equals(criteria.getSubjectId(), course.getSubject().getId())) {
            return false;
        }

        if (Boolean.TRUE.equals(criteria.getCurrentVersionOnly()) && currentCourseVersion == null) {
            return false;
        }

        if (!containsIgnoreCase(course.getCourseNumber(), criteria.getCourseNumber())) {
            return false;
        }

        if (!containsIgnoreCase(buildCourseCode(course), criteria.getCourseCode())) {
            return false;
        }

        return containsIgnoreCase(
                currentCourseVersion == null ? null : currentCourseVersion.getTitle(),
                criteria.getTitle()
        );
    }

    private static String buildCourseCode(Course course) {
        if (course == null || course.getSubject() == null || course.getSubject().getCode() == null) {
            return null;
        }

        return course.getSubject().getCode() + course.getCourseNumber();
    }
}
