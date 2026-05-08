package com.msm.sis.api.repository;

import com.msm.sis.api.entity.ProgramVersionRequirement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProgramVersionRequirementRepository extends JpaRepository<ProgramVersionRequirement, Long> {
    @EntityGraph(attributePaths = {"programVersion", "requirement"})
    @Query("""
            select programVersionRequirement
            from ProgramVersionRequirement programVersionRequirement
            where programVersionRequirement.programVersion.id = :programVersionId
            order by programVersionRequirement.sortOrder asc, programVersionRequirement.id asc
            """)
    List<ProgramVersionRequirement> findRequirementsForVersion(
            @Param("programVersionId") Long programVersionId
    );

    @Query("""
            select count(programVersionRequirement) > 0
            from ProgramVersionRequirement programVersionRequirement
            where programVersionRequirement.programVersion.id = :programVersionId
              and programVersionRequirement.requirement.id = :requirementId
            """)
    boolean hasRequirement(
            @Param("programVersionId") Long programVersionId,
            @Param("requirementId") Long requirementId
    );
}
