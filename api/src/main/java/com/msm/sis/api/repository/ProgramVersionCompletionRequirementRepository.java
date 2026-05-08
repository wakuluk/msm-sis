package com.msm.sis.api.repository;

import com.msm.sis.api.entity.ProgramVersionCompletionRequirement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProgramVersionCompletionRequirementRepository extends JpaRepository<ProgramVersionCompletionRequirement, Long> {

    @EntityGraph(attributePaths = {
            "programVersion",
            "options",
            "options.requiredProgramType",
            "options.requiredProgram",
            "options.requiredProgramVersion",
            "options.requiredProgramVersion.program"
    })
    @Query("""
            select distinct completionRequirement
            from ProgramVersionCompletionRequirement completionRequirement
            left join completionRequirement.options option
            where completionRequirement.programVersion.id = :programVersionId
            order by completionRequirement.sortOrder asc, completionRequirement.id asc
            """)
    List<ProgramVersionCompletionRequirement> findCompletionRequirementsForVersion(
            @Param("programVersionId") Long programVersionId
    );

    @EntityGraph(attributePaths = {
            "programVersion",
            "programVersion.program",
            "options",
            "options.requiredProgramType",
            "options.requiredProgram",
            "options.requiredProgramVersion",
            "options.requiredProgramVersion.program"
    })
    @Query("""
            select completionRequirement
            from ProgramVersionCompletionRequirement completionRequirement
            where completionRequirement.id = :programVersionCompletionRequirementId
            """)
    Optional<ProgramVersionCompletionRequirement> findCompletionRequirementById(
            @Param("programVersionCompletionRequirementId") Long programVersionCompletionRequirementId
    );

    @EntityGraph(attributePaths = {
            "programVersion",
            "options",
            "options.requiredProgramType",
            "options.requiredProgram",
            "options.requiredProgramVersion",
            "options.requiredProgramVersion.program"
    })
    @Query("""
            select distinct completionRequirement
            from ProgramVersionCompletionRequirement completionRequirement
            left join completionRequirement.options option
            where completionRequirement.programVersion.id in :programVersionIds
            order by completionRequirement.programVersion.id asc, completionRequirement.sortOrder asc, completionRequirement.id asc
            """)
    List<ProgramVersionCompletionRequirement> findCompletionRequirementsForVersions(
            @Param("programVersionIds") List<Long> programVersionIds
    );
}
