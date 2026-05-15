package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferRequestPolicyWaiver;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransferRequestPolicyWaiverRepository extends JpaRepository<TransferRequestPolicyWaiver, Long> {

    @EntityGraph(attributePaths = {"transferRequest", "waivedByUser"})
    List<TransferRequestPolicyWaiver> findByTransferRequestIdOrderByPolicyCheckTypeAsc(Long transferRequestId);

    @EntityGraph(attributePaths = {"transferRequest", "waivedByUser"})
    Optional<TransferRequestPolicyWaiver> findByTransferRequestIdAndPolicyCheckType(
            Long transferRequestId,
            String policyCheckType
    );
}
