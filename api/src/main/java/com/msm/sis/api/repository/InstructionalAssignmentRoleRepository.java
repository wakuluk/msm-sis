package com.msm.sis.api.repository;

import com.msm.sis.api.entity.InstructionalAssignmentRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstructionalAssignmentRoleRepository extends JpaRepository<InstructionalAssignmentRole, Long> {
    Optional<InstructionalAssignmentRole> findByCode(String code);

    List<InstructionalAssignmentRole> findAllByActiveTrueOrderBySortOrderAsc();
}
