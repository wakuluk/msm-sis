package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionGrade;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentSectionGradeRepository extends JpaRepository<StudentSectionGrade, Long> {

    @EntityGraph(attributePaths = {"studentSectionEnrollment", "gradeType", "gradeMark"})
    List<StudentSectionGrade> findAllByStudentSectionEnrollment_IdOrderByPostedAtDesc(Long studentSectionEnrollmentId);
}
