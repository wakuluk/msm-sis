package com.msm.sis.api.repository;

import com.msm.sis.api.entity.ProgramType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProgramTypeRepository extends JpaRepository<ProgramType, Long> {
    Optional<ProgramType> findByCode(String code);

    @Query("""
            select programType
            from ProgramType programType
            order by programType.sortOrder asc
            """)
    List<ProgramType> findOptions();
}
