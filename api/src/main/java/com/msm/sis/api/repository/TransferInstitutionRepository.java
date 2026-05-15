package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferInstitution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransferInstitutionRepository extends JpaRepository<TransferInstitution, Long> {
    Optional<TransferInstitution> findByCode(String code);

    List<TransferInstitution> findTop20ByActiveTrueOrderByNameAsc();

    List<TransferInstitution> findTop20ByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String name);
}
