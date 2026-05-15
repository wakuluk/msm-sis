package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferCreditPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransferCreditPolicyRepository extends JpaRepository<TransferCreditPolicy, Long> {

    List<TransferCreditPolicy> findAllByOrderByEffectiveStartDateDesc();

    Optional<TransferCreditPolicy> findFirstByEffectiveEndDateIsNullOrderByEffectiveStartDateDesc();

    @Query("""
            SELECT policy
            FROM TransferCreditPolicy policy
            WHERE policy.effectiveStartDate <= :requestDate
              AND (policy.effectiveEndDate IS NULL OR policy.effectiveEndDate >= :requestDate)
            ORDER BY policy.effectiveStartDate DESC
            """)
    List<TransferCreditPolicy> findEffectivePolicyForDate(@Param("requestDate") LocalDate requestDate);
}
