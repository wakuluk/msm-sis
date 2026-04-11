package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogTerm;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogTermRepository extends JpaRepository<CatalogTerm, Long> {
    @EntityGraph(attributePaths = {"academicYear", "status"})
    Optional<CatalogTerm> findByCode(String code);

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"academicYear", "status"})
    List<CatalogTerm> findAllByActiveTrueOrderBySortOrderAsc();
}
