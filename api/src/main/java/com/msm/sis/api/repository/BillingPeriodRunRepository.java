package com.msm.sis.api.repository;

import com.msm.sis.api.entity.BillingPeriodRun;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillingPeriodRunRepository extends JpaRepository<BillingPeriodRun, Long> {
    @EntityGraph(attributePaths = {
            "billingPeriod",
            "triggeredByUser",
            "createdByUser",
            "updatedByUser"
    })
    List<BillingPeriodRun> findByBillingPeriod_IdOrderByCreatedAtDescIdDesc(Long billingPeriodId);
}
