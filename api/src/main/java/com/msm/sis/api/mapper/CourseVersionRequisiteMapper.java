package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.course.CourseVersionRequisiteCourseResponse;
import com.msm.sis.api.dto.course.CourseVersionRequisiteGroupResponse;
import com.msm.sis.api.dto.course.CreateCourseVersionRequisiteCourseRequest;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.CourseVersionRequisiteCourse;
import com.msm.sis.api.entity.CourseVersionRequisiteGroup;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class CourseVersionRequisiteMapper {

    public CourseVersionRequisiteGroup toGroup(
            CourseVersion courseVersion,
            String requisiteType,
            String conditionType,
            Integer minimumRequired,
            Integer sortOrder
    ) {
        CourseVersionRequisiteGroup group = new CourseVersionRequisiteGroup();
        group.setCourseVersion(courseVersion);
        group.setRequisiteType(requisiteType);
        group.setConditionType(conditionType);
        group.setMinimumRequired(minimumRequired);
        group.setSortOrder(defaultSortOrder(sortOrder));
        return group;
    }

    public CourseVersionRequisiteCourse toCourse(
            CourseVersionRequisiteGroup group,
            CreateCourseVersionRequisiteCourseRequest request,
            Map<Long, Course> coursesById
    ) {
        CourseVersionRequisiteCourse requisiteCourse = new CourseVersionRequisiteCourse();
        requisiteCourse.setGroup(group);
        requisiteCourse.setCourse(coursesById.get(request.courseId()));
        requisiteCourse.setSortOrder(defaultSortOrder(request.sortOrder()));
        return requisiteCourse;
    }

    public CourseVersionRequisiteGroupResponse toGroupResponse(
            CourseVersionRequisiteGroup group,
            List<CourseVersionRequisiteCourse> courses
    ) {
        return new CourseVersionRequisiteGroupResponse(
                group.getId(),
                group.getRequisiteType(),
                group.getConditionType(),
                group.getMinimumRequired(),
                group.getSortOrder(),
                courses.stream().map(this::toCourseResponse).toList()
        );
    }

    public CourseVersionRequisiteCourseResponse toCourseResponse(CourseVersionRequisiteCourse requisiteCourse) {
        Course course = requisiteCourse.getCourse();
        String subjectCode = course == null || course.getSubject() == null ? null : course.getSubject().getCode();
        String courseNumber = course == null ? null : course.getCourseNumber();

        return new CourseVersionRequisiteCourseResponse(
                requisiteCourse.getId(),
                course == null ? null : course.getId(),
                course == null || course.getSubject() == null ? null : course.getSubject().getId(),
                subjectCode,
                courseNumber,
                subjectCode == null || courseNumber == null ? null : subjectCode + courseNumber,
                course != null && course.isLab(),
                requisiteCourse.getSortOrder()
        );
    }

    private Integer defaultSortOrder(Integer sortOrder) {
        return sortOrder == null ? 0 : sortOrder;
    }
}
