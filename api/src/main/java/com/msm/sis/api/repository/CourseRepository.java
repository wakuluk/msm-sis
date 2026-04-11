package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    @EntityGraph(attributePaths = {"subject", "subject.department"})
    Optional<Course> findBySubject_CodeAndCourseNumber(String subjectCode, String courseNumber);

    boolean existsBySubject_CodeAndCourseNumber(String subjectCode, String courseNumber);

    @EntityGraph(attributePaths = {"subject", "subject.department"})
    List<Course> findAllByActiveTrue();
}
