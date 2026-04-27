package com.msm.sis.api.repository;

import com.msm.sis.api.entity.DeliveryMode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryModeRepository extends JpaRepository<DeliveryMode, Long> {
    Optional<DeliveryMode> findByCode(String code);

    List<DeliveryMode> findAllByActiveTrueOrderBySortOrderAsc();

    List<DeliveryMode> findAllByActiveTrueOrderByNameAsc();
}
