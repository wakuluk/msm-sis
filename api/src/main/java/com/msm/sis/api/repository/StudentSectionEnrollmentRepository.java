package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionEnrollment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentSectionEnrollmentRepository extends JpaRepository<StudentSectionEnrollment, Long> {

    @Override
    @EntityGraph(attributePaths = {"student", "courseSection", "status", "gradingBasis", "grades", "grades.gradeType", "grades.gradeMark"})
    Optional<StudentSectionEnrollment> findById(Long id);

    @EntityGraph(attributePaths = {"student", "status", "gradingBasis"})
    List<StudentSectionEnrollment> findAllByCourseSection_IdOrderByStudent_LastNameAscStudent_FirstNameAsc(
            Long sectionId
    );
}
