package com.msm.sis.api.repository;

import com.msm.sis.api.entity.DegreeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DegreeTypeRepository extends JpaRepository<DegreeType, Long> {
    Optional<DegreeType> findByCode(String code);

    @Query("""
            select degreeType
            from DegreeType degreeType
            order by degreeType.sortOrder asc
            """)
    List<DegreeType> findOptions();
}
