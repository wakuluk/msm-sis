package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicTermGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicTermGroupRepository extends JpaRepository<AcademicTermGroup, Long> {
    @EntityGraph(attributePaths = {"academicYear", "academicTerms", "academicTerms.academicYear", "academicTerms.status"})
    Optional<AcademicTermGroup> findDetailedById(Long termGroupId);

    @EntityGraph(attributePaths = {"academicYear", "academicTerms", "academicTerms.academicYear", "academicTerms.status"})
    Optional<AcademicTermGroup> findByAcademicYear_IdAndCode(Long academicYearId, String code);

    boolean existsByAcademicYear_IdAndCode(Long academicYearId, String code);

    @EntityGraph(attributePaths = {"academicYear", "academicTerms", "academicTerms.academicYear", "academicTerms.status"})
    List<AcademicTermGroup> findAllByAcademicYear_IdOrderByStartDateAsc(Long academicYearId);

    Optional<AcademicTermGroup> findByAcademicTerms_Id(Long termId);

    List<AcademicTermGroup> findDistinctByAcademicTerms_IdIn(List<Long> termIds);
}
