package com.msm.sis.api.repository;

import com.msm.sis.api.entity.ProgramVersion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProgramVersionRepository extends JpaRepository<ProgramVersion, Long> {
    @Override
    @EntityGraph(attributePaths = {
            "program",
            "program.school",
            "program.department",
            "program.programType",
            "program.degreeType"
    })
    Optional<ProgramVersion> findById(Long id);

    @EntityGraph(attributePaths = {
            "program",
            "program.school",
            "program.department",
            "program.programType",
            "program.degreeType"
    })
    @Query("""
            select programVersion
            from ProgramVersion programVersion
            where programVersion.program.id = :programId
            order by programVersion.versionNumber desc
            """)
    List<ProgramVersion> findVersionsForProgram(@Param("programId") Long programId);

    @EntityGraph(attributePaths = {
            "program",
            "program.school",
            "program.department",
            "program.programType",
            "program.degreeType"
    })
    @Query("""
            select programVersion
            from ProgramVersion programVersion
            where programVersion.program.id in :programIds
              and programVersion.published = true
              and programVersion.classYearEnd is null
            """)
    List<ProgramVersion> findOpenEndedVersionsForPrograms(@Param("programIds") List<Long> programIds);
}
