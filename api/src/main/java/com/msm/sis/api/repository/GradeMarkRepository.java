package com.msm.sis.api.repository;

import com.msm.sis.api.entity.GradeMark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeMarkRepository extends JpaRepository<GradeMark, Long> {
    Optional<GradeMark> findByCode(String code);

    Optional<GradeMark> findByCodeAndActiveTrue(String code);

    List<GradeMark> findAllByActiveTrueOrderBySortOrderAsc();

    List<GradeMark> findAllByActiveTrueOrderByNameAsc();
}
