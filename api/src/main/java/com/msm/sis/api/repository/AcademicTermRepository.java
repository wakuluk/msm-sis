package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicTerm;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AcademicTermRepository extends JpaRepository<AcademicTerm, Long> {
    @EntityGraph(attributePaths = {"academicYear", "status"})
    Optional<AcademicTerm> findDetailedById(Long termId);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    Optional<AcademicTerm> findByAcademicYear_IdAndCode(Long academicYearId, String code);

    boolean existsByAcademicYear_IdAndCode(Long academicYearId, String code);

    boolean existsByAcademicYear_IdAndSortOrder(Long academicYearId, Integer sortOrder);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<AcademicTerm> findAllByAcademicYear_IdOrderBySortOrderAsc(Long academicYearId);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<AcademicTerm> findAllByIdInOrderBySortOrderAsc(List<Long> termIds);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<AcademicTerm> findAllByActiveTrueOrderBySortOrderAsc();

    @EntityGraph(attributePaths = {"academicYear", "status"})
    @Query("""
            select term
            from AcademicTerm term
            join term.academicYear academicYear
            where term.active = true
              and academicYear.active = true
              and academicYear.isPublished = true
            order by term.sortOrder asc
            """)
    List<AcademicTerm> findAllForStudentCatalogSearchOrderBySortOrderAsc();
}
