package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicSchool;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicSchoolRepository extends JpaRepository<AcademicSchool, Long> {
    Optional<AcademicSchool> findByCode(String code);
    boolean existsByCode(String code);
    List<AcademicSchool> findAllByActiveTrueOrderByNameAsc();
}
