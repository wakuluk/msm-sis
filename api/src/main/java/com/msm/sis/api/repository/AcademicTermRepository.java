package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicTerm;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicTermRepository extends JpaRepository<AcademicTerm, Long> {
    @EntityGraph(attributePaths = {"academicYear", "academicSubTerms", "academicSubTerms.academicYear", "academicSubTerms.status"})
    Optional<AcademicTerm> findDetailedById(Long termId);

    @EntityGraph(attributePaths = {"academicYear", "academicSubTerms", "academicSubTerms.academicYear", "academicSubTerms.status"})
    Optional<AcademicTerm> findByAcademicYear_IdAndCode(Long academicYearId, String code);

    boolean existsByAcademicYear_IdAndCode(Long academicYearId, String code);

    @EntityGraph(attributePaths = {"academicYear", "academicSubTerms", "academicSubTerms.academicYear", "academicSubTerms.status"})
    List<AcademicTerm> findAllByAcademicYear_IdOrderByStartDateAsc(Long academicYearId);

    Optional<AcademicTerm> findByAcademicSubTerms_Id(Long subTermId);

    List<AcademicTerm> findDistinctByAcademicSubTerms_IdIn(List<Long> subTermIds);
}
