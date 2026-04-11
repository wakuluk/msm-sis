package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogTermStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogTermStatusRepository extends JpaRepository<CatalogTermStatus, Long> {
    Optional<CatalogTermStatus> findByCode(String code);
    List<CatalogTermStatus> findAllByActiveTrueOrderByNameAsc();
}
