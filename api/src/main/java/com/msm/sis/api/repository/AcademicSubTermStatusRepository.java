package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicSubTermStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicSubTermStatusRepository extends JpaRepository<AcademicSubTermStatus, Long> {
    Optional<AcademicSubTermStatus> findByCode(String code);

    List<AcademicSubTermStatus> findAllByOrderBySortOrderAsc();

    List<AcademicSubTermStatus> findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();

    List<AcademicSubTermStatus> findAllByActiveTrueOrderBySortOrderAsc();

    List<AcademicSubTermStatus> findAllByActiveTrueOrderByNameAsc();
}
