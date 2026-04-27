package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicDivision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicDivisionRepository extends JpaRepository<AcademicDivision, Long> {
    Optional<AcademicDivision> findByCode(String code);

    List<AcademicDivision> findAllByActiveTrueOrderBySortOrderAsc();

    List<AcademicDivision> findAllByActiveTrueOrderByNameAsc();
}
