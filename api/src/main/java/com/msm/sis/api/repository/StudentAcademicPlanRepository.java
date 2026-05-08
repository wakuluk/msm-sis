package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentAcademicPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudentAcademicPlanRepository extends JpaRepository<StudentAcademicPlan, Long> {
    @Query("""
            select studentAcademicPlan
            from StudentAcademicPlan studentAcademicPlan
            where studentAcademicPlan.student.id = :studentId
              and studentAcademicPlan.active = true
            """)
    Optional<StudentAcademicPlan> findActivePlanForStudent(@Param("studentId") Long studentId);
}
