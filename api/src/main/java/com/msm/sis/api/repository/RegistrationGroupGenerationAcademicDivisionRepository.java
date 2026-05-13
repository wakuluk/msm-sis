package com.msm.sis.api.repository;

import com.msm.sis.api.entity.RegistrationGroupGenerationAcademicDivision;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RegistrationGroupGenerationAcademicDivisionRepository
        extends JpaRepository<RegistrationGroupGenerationAcademicDivision, Long> {

    @EntityGraph(attributePaths = {"academicDivision"})
    @Query("""
            select generationAcademicDivision
            from RegistrationGroupGenerationAcademicDivision generationAcademicDivision
            where generationAcademicDivision.registrationGroupGeneration.id = :registrationGroupGenerationId
            order by generationAcademicDivision.academicDivision.sortOrder asc,
                     generationAcademicDivision.academicDivision.name asc,
                     generationAcademicDivision.academicDivision.id asc
            """)
    List<RegistrationGroupGenerationAcademicDivision> findAcademicDivisionsForGeneration(
            @Param("registrationGroupGenerationId") Long registrationGroupGenerationId
    );
}
