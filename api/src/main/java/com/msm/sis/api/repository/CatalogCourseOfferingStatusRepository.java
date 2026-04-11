package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogCourseOfferingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogCourseOfferingStatusRepository extends JpaRepository<CatalogCourseOfferingStatus, Long> {
    Optional<CatalogCourseOfferingStatus> findByCode(String code);
    List<CatalogCourseOfferingStatus> findAllByActiveTrueOrderByNameAsc();
}
