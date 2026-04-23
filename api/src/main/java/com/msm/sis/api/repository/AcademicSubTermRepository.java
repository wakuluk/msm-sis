package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicSubTerm;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AcademicSubTermRepository extends JpaRepository<AcademicSubTerm, Long> {
    @EntityGraph(attributePaths = {"academicYear", "status"})
    Optional<AcademicSubTerm> findDetailedById(Long subTermId);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    Optional<AcademicSubTerm> findByAcademicYear_IdAndCode(Long academicYearId, String code);

    boolean existsByAcademicYear_IdAndCode(Long academicYearId, String code);

    boolean existsByAcademicYear_IdAndSortOrder(Long academicYearId, Integer sortOrder);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<AcademicSubTerm> findAllByAcademicYear_IdOrderBySortOrderAsc(Long academicYearId);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<AcademicSubTerm> findAllByIdInOrderBySortOrderAsc(List<Long> subTermIds);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<AcademicSubTerm> findAllByActiveTrueOrderBySortOrderAsc();

    @EntityGraph(attributePaths = {"academicYear", "status"})
    @Query("""
            select term
            from AcademicSubTerm term
            join term.academicYear academicYear
            where term.active = true
              and academicYear.active = true
              and academicYear.isPublished = true
            order by term.sortOrder asc
            """)
    List<AcademicSubTerm> findAllForStudentCatalogSearchOrderBySortOrderAsc();
}
