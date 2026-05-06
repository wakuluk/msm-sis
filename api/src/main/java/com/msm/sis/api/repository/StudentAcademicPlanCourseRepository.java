package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentAcademicPlanCourseRepository extends JpaRepository<StudentAcademicPlanCourse, Long> {
    @EntityGraph(attributePaths = {
            "course",
            "course.subject",
            "requirement",
            "studentProgram",
            "studentAcademicPlanTerm",
            "studentAcademicPlanTerm.studentAcademicPlanYear",
            "studentAcademicPlanTerm.studentAcademicPlanYear.studentAcademicPlan",
            "studentAcademicPlanTerm.studentAcademicPlanYear.studentAcademicPlan.student"
    })
    @Query("""
            SELECT academicPlanCourse
            FROM StudentAcademicPlanCourse academicPlanCourse
            WHERE academicPlanCourse.id = :studentAcademicPlanCourseId
            """)
    Optional<StudentAcademicPlanCourse> findPlanCourseForReplacement(
            @Param("studentAcademicPlanCourseId") Long studentAcademicPlanCourseId
    );

    List<StudentAcademicPlanCourse> findByStudentAcademicPlanTermIdOrderBySortOrderAsc(Long studentAcademicPlanTermId);

    @Modifying
    @Query("""
            DELETE FROM StudentAcademicPlanCourse academicPlanCourse
            WHERE academicPlanCourse.studentAcademicPlanTerm.id IN (
                SELECT academicPlanTerm.id
                FROM StudentAcademicPlanTerm academicPlanTerm
                WHERE academicPlanTerm.studentAcademicPlanYear.studentAcademicPlan.id = :studentAcademicPlanId
            )
            """)
    void deleteByStudentAcademicPlanId(@Param("studentAcademicPlanId") Long studentAcademicPlanId);

    @Modifying
    @Query("""
            DELETE FROM StudentAcademicPlanCourse academicPlanCourse
            WHERE academicPlanCourse.studentProgram.id = :studentProgramId
              AND academicPlanCourse.studentAcademicPlanTerm.id IN (
                  SELECT academicPlanTerm.id
                  FROM StudentAcademicPlanTerm academicPlanTerm
                  WHERE academicPlanTerm.studentAcademicPlanYear.studentAcademicPlan.student.id = :studentId
              )
            """)
    void deleteByStudentIdAndStudentProgramId(
            @Param("studentId") Long studentId,
            @Param("studentProgramId") Long studentProgramId
    );
}
