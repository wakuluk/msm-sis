package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseVersion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseVersionRepository extends JpaRepository<CourseVersion, Long> {
    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    Optional<CourseVersion> findByCourse_IdAndVersionNumber(Long courseId, Integer versionNumber);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    List<CourseVersion> findAllByCourse_IdOrderByVersionNumberDesc(Long courseId);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    List<CourseVersion> findAllByCourse_IdAndDefaultVersionTrueOrderByVersionNumberDesc(Long courseId);

    @EntityGraph(attributePaths = {"course", "course.subject", "course.subject.department"})
    List<CourseVersion> findAllByActiveTrue();
}
