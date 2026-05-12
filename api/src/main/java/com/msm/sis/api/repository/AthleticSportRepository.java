package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AthleticSport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AthleticSportRepository extends JpaRepository<AthleticSport, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @EntityGraph(attributePaths = {"updatedByUser"})
    @Query("""
            select sport
            from AthleticSport sport
            order by sport.name asc, sport.id asc
            """)
    List<AthleticSport> findAllForManagement();

    @EntityGraph(attributePaths = {"updatedByUser"})
    @Query("""
            select sport
            from AthleticSport sport
            where sport.active = true
            order by sport.name asc, sport.id asc
            """)
    List<AthleticSport> findActiveForSelection();
}
