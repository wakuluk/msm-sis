package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicCareerRegistrationDivision;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AcademicCareerRegistrationDivisionRepository
        extends JpaRepository<AcademicCareerRegistrationDivision, Long> {
    @EntityGraph(attributePaths = {"academicCareer", "academicDivision"})
    @Query("""
            select registrationDivision
            from AcademicCareerRegistrationDivision registrationDivision
            where registrationDivision.academicCareer.id = :academicCareerId
            order by registrationDivision.academicDivision.sortOrder asc,
                     registrationDivision.academicDivision.name asc
            """)
    List<AcademicCareerRegistrationDivision> findAllForAcademicCareer(
            @Param("academicCareerId") Long academicCareerId
    );

    @EntityGraph(attributePaths = {"academicCareer", "academicDivision"})
    @Query("""
            select registrationDivision
            from AcademicCareerRegistrationDivision registrationDivision
            where registrationDivision.academicCareer.id in :academicCareerIds
            order by registrationDivision.academicCareer.sortOrder asc,
                     registrationDivision.academicDivision.sortOrder asc,
                     registrationDivision.academicDivision.name asc
            """)
    List<AcademicCareerRegistrationDivision> findAllForAcademicCareers(
            @Param("academicCareerIds") List<Long> academicCareerIds
    );
}
