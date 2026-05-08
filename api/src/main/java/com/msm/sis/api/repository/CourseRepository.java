package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    @Override
    @EntityGraph(attributePaths = {"subject", "subject.department", "subject.department.school"})
    Optional<Course> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"subject", "subject.department", "subject.department.school"})
    List<Course> findAll();

    @EntityGraph(attributePaths = {"subject", "subject.department", "subject.department.school"})
    Optional<Course> findBySubject_CodeAndCourseNumber(String subjectCode, String courseNumber);

    boolean existsBySubject_CodeAndCourseNumber(String subjectCode, String courseNumber);

    @EntityGraph(attributePaths = {"subject", "subject.department", "subject.department.school"})
    List<Course> findAllByActiveTrue();

    @EntityGraph(attributePaths = {"subject", "subject.department", "subject.department.school"})
    @Query("""
            SELECT course
            FROM Course course
            WHERE course.id IN :courseIds
            """)
    List<Course> findCoursesByIds(@Param("courseIds") List<Long> courseIds);

    @EntityGraph(attributePaths = {"subject", "subject.department", "subject.department.school"})
    List<Course> findAllBySubject_Department_Id(Long departmentId, org.springframework.data.domain.Sort sort);

    @EntityGraph(attributePaths = {"subject", "subject.department", "subject.department.school"})
    List<Course> findAllBySubject_IdAndSubject_Department_Id(
            Long subjectId,
            Long departmentId,
            org.springframework.data.domain.Sort sort
    );
}
