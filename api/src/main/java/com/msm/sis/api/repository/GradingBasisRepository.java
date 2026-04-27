package com.msm.sis.api.repository;

import com.msm.sis.api.entity.GradingBasis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradingBasisRepository extends JpaRepository<GradingBasis, Long> {
    Optional<GradingBasis> findByCode(String code);

    List<GradingBasis> findAllByActiveTrueOrderBySortOrderAsc();

    List<GradingBasis> findAllByActiveTrueOrderByNameAsc();
}
