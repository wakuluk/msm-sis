package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentAcademicPlanTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentAcademicPlanTermRepository extends JpaRepository<StudentAcademicPlanTerm, Long> {
    List<StudentAcademicPlanTerm> findByStudentAcademicPlanYearIdOrderBySortOrderAsc(Long studentAcademicPlanYearId);

    @Modifying
    @Query("""
            DELETE FROM StudentAcademicPlanTerm academicPlanTerm
            WHERE academicPlanTerm.studentAcademicPlanYear.studentAcademicPlan.id = :studentAcademicPlanId
            """)
    void deleteByStudentAcademicPlanId(@Param("studentAcademicPlanId") Long studentAcademicPlanId);
}
