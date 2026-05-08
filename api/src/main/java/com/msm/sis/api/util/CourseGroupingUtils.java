package com.msm.sis.api.util;

import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class CourseGroupingUtils {
    private CourseGroupingUtils() {
    }

    public static List<Long> collectCourseIds(List<Course> courses) {
        return courses.stream()
                .map(Course::getId)
                .filter(Objects::nonNull)
                .toList();
    }

    public static Map<Long, CourseVersion> indexFirstVersionByCourseId(List<CourseVersion> courseVersions) {
        Map<Long, CourseVersion> versionsByCourseId = new LinkedHashMap<>();
        courseVersions.forEach(courseVersion -> {
            Long courseId = getCourseId(courseVersion);
            if (courseId == null) {
                return;
            }

            versionsByCourseId.putIfAbsent(courseId, courseVersion);
        });

        return versionsByCourseId;
    }

    private static Long getCourseId(CourseVersion courseVersion) {
        if (courseVersion.getCourse() == null) {
            return null;
        }

        return courseVersion.getCourse().getId();
    }
}
