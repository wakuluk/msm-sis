package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseVersionRequisiteGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseVersionRequisiteGroupRepository extends JpaRepository<CourseVersionRequisiteGroup, Long> {

    @EntityGraph(attributePaths = {"courseVersion", "courseVersion.course"})
    @Query("""
            SELECT requisiteGroup
            FROM CourseVersionRequisiteGroup requisiteGroup
            WHERE requisiteGroup.courseVersion.id = :courseVersionId
            ORDER BY requisiteGroup.sortOrder ASC,
                     requisiteGroup.id ASC
            """)
    List<CourseVersionRequisiteGroup> findGroupsForCourseVersion(
            @Param("courseVersionId") Long courseVersionId
    );

    @EntityGraph(attributePaths = {"courseVersion", "courseVersion.course"})
    @Query("""
            SELECT requisiteGroup
            FROM CourseVersionRequisiteGroup requisiteGroup
            WHERE requisiteGroup.courseVersion.id IN :courseVersionIds
            ORDER BY requisiteGroup.courseVersion.id ASC,
                     requisiteGroup.sortOrder ASC,
                     requisiteGroup.id ASC
            """)
    List<CourseVersionRequisiteGroup> findGroupsForCourseVersions(
            @Param("courseVersionIds") List<Long> courseVersionIds
    );

    @EntityGraph(attributePaths = {"courseVersion", "courseVersion.course"})
    @Query("""
            SELECT requisiteGroup
            FROM CourseVersionRequisiteGroup requisiteGroup
            WHERE requisiteGroup.courseVersion.id = :courseVersionId
              AND requisiteGroup.requisiteType = :requisiteType
            ORDER BY requisiteGroup.sortOrder ASC,
                     requisiteGroup.id ASC
            """)
    List<CourseVersionRequisiteGroup> findGroupsForCourseVersionByType(
            @Param("courseVersionId") Long courseVersionId,
            @Param("requisiteType") String requisiteType
    );
}
