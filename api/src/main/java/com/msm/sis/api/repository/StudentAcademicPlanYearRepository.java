package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentAcademicPlanYear;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentAcademicPlanYearRepository extends JpaRepository<StudentAcademicPlanYear, Long> {
    List<StudentAcademicPlanYear> findByStudentAcademicPlanIdOrderBySortOrderAsc(Long studentAcademicPlanId);

    @Modifying
    @Query("""
            DELETE FROM StudentAcademicPlanYear academicPlanYear
            WHERE academicPlanYear.studentAcademicPlan.id = :studentAcademicPlanId
            """)
    void deleteByStudentAcademicPlanId(@Param("studentAcademicPlanId") Long studentAcademicPlanId);
}
