package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicDepartment;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicDepartmentRepository extends JpaRepository<AcademicDepartment, Long> {
    Optional<AcademicDepartment> findByCode(String code);
    boolean existsByCode(String code);
    List<AcademicDepartment> findAllByActiveTrueOrderByNameAsc();
    List<AcademicDepartment> findAllBySchool_IdIn(List<Long> schoolIds, Sort sort);
    List<AcademicDepartment> findAllByActiveTrueAndSchool_IdIn(List<Long> schoolIds, Sort sort);
}
