package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicYearStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicYearStatusRepository extends JpaRepository<AcademicYearStatus, Long> {
    Optional<AcademicYearStatus> findByCode(String code);
    List<AcademicYearStatus> findAllByOrderBySortOrderAsc();
    List<AcademicYearStatus> findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();
}
