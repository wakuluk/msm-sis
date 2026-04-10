package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogCourseVersion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogCourseVersionRepository extends JpaRepository<CatalogCourseVersion, Long> {
    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    Optional<CatalogCourseVersion> findByCourse_IdAndVersionNumber(Long courseId, Integer versionNumber);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    List<CatalogCourseVersion> findAllByCourse_IdOrderByVersionNumberDesc(Long courseId);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    List<CatalogCourseVersion> findAllByCourse_IdAndDefaultVersionTrueOrderByVersionNumberDesc(Long courseId);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    List<CatalogCourseVersion> findAllByActiveTrue();
}
