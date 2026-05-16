package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentTuitionCodeAssignment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentTuitionCodeAssignmentRepository
        extends JpaRepository<StudentTuitionCodeAssignment, Long> {
    @EntityGraph(attributePaths = {"student", "tuitionCode", "createdByUser", "updatedByUser"})
    Optional<StudentTuitionCodeAssignment> findByStudent_Id(Long studentId);

    boolean existsByStudent_Id(Long studentId);
}

