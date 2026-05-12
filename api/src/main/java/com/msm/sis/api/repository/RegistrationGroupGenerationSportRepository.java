package com.msm.sis.api.repository;

import com.msm.sis.api.entity.RegistrationGroupGenerationSport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RegistrationGroupGenerationSportRepository extends JpaRepository<RegistrationGroupGenerationSport, Long> {

    @EntityGraph(attributePaths = {"athleticSport"})
    @Query("""
            select generationSport
            from RegistrationGroupGenerationSport generationSport
            where generationSport.registrationGroupGeneration.id = :registrationGroupGenerationId
            order by generationSport.athleticSport.name asc,
                     generationSport.athleticSport.code asc,
                     generationSport.athleticSport.id asc
            """)
    List<RegistrationGroupGenerationSport> findSportsForGeneration(
            @Param("registrationGroupGenerationId") Long registrationGroupGenerationId
    );
}
