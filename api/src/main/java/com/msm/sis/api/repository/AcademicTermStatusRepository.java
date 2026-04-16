package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicTermStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicTermStatusRepository extends JpaRepository<AcademicTermStatus, Long> {
    Optional<AcademicTermStatus> findByCode(String code);

    List<AcademicTermStatus> findAllByOrderBySortOrderAsc();

    List<AcademicTermStatus> findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();

    List<AcademicTermStatus> findAllByActiveTrueOrderBySortOrderAsc();

    List<AcademicTermStatus> findAllByActiveTrueOrderByNameAsc();
}
