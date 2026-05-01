package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RequirementRepository extends JpaRepository<Requirement, Long> {
    Optional<Requirement> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
            select requirement
            from Requirement requirement
            order by requirement.name asc
            """)
    List<Requirement> findRequirementsByName();
}
