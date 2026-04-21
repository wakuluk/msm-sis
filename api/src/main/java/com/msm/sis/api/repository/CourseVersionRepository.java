package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseVersionRepository extends JpaRepository<CourseVersion, Long> {
    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    @Query("""
            SELECT courseVersion
            FROM CourseVersion courseVersion
            WHERE courseVersion.id = :courseVersionId
            """)
    Optional<CourseVersion> findCourseVersionById(@Param("courseVersionId") Long courseVersionId);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    @Query("""
            SELECT courseVersion
            FROM CourseVersion courseVersion
            WHERE courseVersion.course.id = :courseId
              AND courseVersion.versionNumber = :versionNumber
            """)
    Optional<CourseVersion> findCourseVersionByCourseIdAndVersionNumber(
            @Param("courseId") Long courseId,
            @Param("versionNumber") Integer versionNumber
    );

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    @Query("""
            SELECT courseVersion
            FROM CourseVersion courseVersion
            WHERE courseVersion.course.id = :courseId
            ORDER BY courseVersion.versionNumber DESC, courseVersion.id DESC
            """)
    List<CourseVersion> findCourseVersionsByCourseId(
            @Param("courseId") Long courseId,
            Pageable pageable
    );

    default Optional<CourseVersion> findLatestCourseVersionByCourseId(Long courseId) {
        return findCourseVersionsByCourseId(courseId, PageRequest.of(0, 1)).stream().findFirst();
    }

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    @Query("""
            SELECT courseVersion
            FROM CourseVersion courseVersion
            WHERE courseVersion.course.id = :courseId
            """)
    Page<CourseVersion> searchCourseVersionsByCourseId(
            @Param("courseId") Long courseId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    @Query("""
            SELECT courseVersion
            FROM CourseVersion courseVersion
            WHERE courseVersion.course.id = :courseId
              AND courseVersion.currentVersion = TRUE
            ORDER BY courseVersion.versionNumber DESC, courseVersion.id DESC
            """)
    List<CourseVersion> findCurrentCourseVersionsByCourseId(@Param("courseId") Long courseId);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    @Query("""
            SELECT courseVersion
            FROM CourseVersion courseVersion
            WHERE courseVersion.currentVersion = TRUE
            ORDER BY courseVersion.course.id ASC, courseVersion.versionNumber DESC, courseVersion.id DESC
            """)
    List<CourseVersion> findCurrentCourseVersions();

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    @Query("""
            SELECT courseVersion
            FROM CourseVersion courseVersion
            WHERE courseVersion.course.id IN :courseIds
              AND courseVersion.currentVersion = TRUE
            ORDER BY courseVersion.course.id ASC, courseVersion.versionNumber DESC, courseVersion.id DESC
            """)
    List<CourseVersion> findCurrentCourseVersionsByCourseIds(@Param("courseIds") List<Long> courseIds);
}
