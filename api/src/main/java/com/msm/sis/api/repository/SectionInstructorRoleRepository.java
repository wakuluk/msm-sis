package com.msm.sis.api.repository;

import com.msm.sis.api.entity.SectionInstructorRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SectionInstructorRoleRepository extends JpaRepository<SectionInstructorRole, Long> {
    Optional<SectionInstructorRole> findByCode(String code);

    List<SectionInstructorRole> findAllByActiveTrueOrderBySortOrderAsc();

    List<SectionInstructorRole> findAllByActiveTrueOrderByNameAsc();
}
