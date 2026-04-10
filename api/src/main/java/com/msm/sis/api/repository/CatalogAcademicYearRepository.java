package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogAcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogAcademicYearRepository extends JpaRepository<CatalogAcademicYear, Long> {
    Optional<CatalogAcademicYear> findByCode(String code);
    boolean existsByCode(String code);
    List<CatalogAcademicYear> findAllByActiveTrueOrderByStartDateAsc();
}
