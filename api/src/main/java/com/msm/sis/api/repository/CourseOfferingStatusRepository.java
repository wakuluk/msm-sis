package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseOfferingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseOfferingStatusRepository extends JpaRepository<CourseOfferingStatus, Long> {
    Optional<CourseOfferingStatus> findByCode(String code);
    List<CourseOfferingStatus> findAllByActiveTrueOrderByNameAsc();
}
