package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogSubject;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogSubjectRepository extends JpaRepository<CatalogSubject, Long> {
    @EntityGraph(attributePaths = {"department"})
    Optional<CatalogSubject> findByCode(String code);

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"department"})
    List<CatalogSubject> findAllByActiveTrueOrderByCodeAsc();

    @EntityGraph(attributePaths = {"department"})
    List<CatalogSubject> findAllByDepartment_CodeAndActiveTrueOrderByCodeAsc(String departmentCode);
}
