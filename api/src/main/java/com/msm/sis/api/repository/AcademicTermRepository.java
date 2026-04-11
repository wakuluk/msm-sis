package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicTerm;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AcademicTermRepository extends JpaRepository<AcademicTerm, Long> {
    @EntityGraph(attributePaths = {"academicYear", "status"})
    Optional<AcademicTerm> findByCode(String code);

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<AcademicTerm> findAllByActiveTrueOrderBySortOrderAsc();

    @EntityGraph(attributePaths = {"academicYear", "status"})
    @Query("""
            select term
            from AcademicTerm term
            join term.academicYear academicYear
            where term.active = true
              and academicYear.active = true
              and academicYear.is_published = true
            order by term.sortOrder asc
            """)
    List<AcademicTerm> findAllForStudentCatalogSearchOrderBySortOrderAsc();
}
