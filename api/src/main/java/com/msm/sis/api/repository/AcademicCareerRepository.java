package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicCareer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicCareerRepository extends JpaRepository<AcademicCareer, Long> {
    Optional<AcademicCareer> findByCode(String code);

    List<AcademicCareer> findAllByActiveTrueOrderBySortOrderAscNameAsc();
}
