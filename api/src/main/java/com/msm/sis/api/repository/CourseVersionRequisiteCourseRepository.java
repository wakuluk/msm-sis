package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseVersionRequisiteCourse;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseVersionRequisiteCourseRepository extends JpaRepository<CourseVersionRequisiteCourse, Long> {

    @EntityGraph(attributePaths = {"group", "course", "course.subject"})
    @Query("""
            SELECT requisiteCourse
            FROM CourseVersionRequisiteCourse requisiteCourse
            WHERE requisiteCourse.group.id = :groupId
            ORDER BY requisiteCourse.sortOrder ASC,
                     requisiteCourse.id ASC
            """)
    List<CourseVersionRequisiteCourse> findCoursesForGroup(@Param("groupId") Long groupId);

    @EntityGraph(attributePaths = {"group", "course", "course.subject"})
    @Query("""
            SELECT requisiteCourse
            FROM CourseVersionRequisiteCourse requisiteCourse
            WHERE requisiteCourse.group.id IN :groupIds
            ORDER BY requisiteCourse.group.id ASC,
                     requisiteCourse.sortOrder ASC,
                     requisiteCourse.id ASC
            """)
    List<CourseVersionRequisiteCourse> findCoursesForGroups(@Param("groupIds") List<Long> groupIds);
}
