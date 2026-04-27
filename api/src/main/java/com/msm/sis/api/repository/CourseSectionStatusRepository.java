package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseSectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseSectionStatusRepository extends JpaRepository<CourseSectionStatus, Long> {
    Optional<CourseSectionStatus> findByCode(String code);

    List<CourseSectionStatus> findAllByOrderBySortOrderAsc();

    List<CourseSectionStatus> findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();

    List<CourseSectionStatus> findAllByActiveTrueOrderBySortOrderAsc();

    List<CourseSectionStatus> findAllByActiveTrueOrderByNameAsc();
}
