package com.msm.sis.api.repository;

import com.msm.sis.api.entity.RegistrationGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RegistrationGroupRepository extends JpaRepository<RegistrationGroup, Long> {

    @EntityGraph(attributePaths = {
            "academicYear",
            "term",
            "registrationGroupGeneration"
    })
    @Query("""
            select registrationGroup
            from RegistrationGroup registrationGroup
            left join registrationGroup.registrationGroupGeneration generation
            join registrationGroup.academicYear academicYear
            join registrationGroup.term term
            where (:academicYearId is null or academicYear.id = :academicYearId)
              and (:termId is null or term.id = :termId)
              and (:status is null or upper(registrationGroup.status) = :status)
              and (
                    :groupQuery is null
                    or lower(concat(
                        coalesce(registrationGroup.name, ''), ' ',
                        coalesce(generation.name, '')
                    )) like :groupQuery
              )
            """)
    List<RegistrationGroup> searchRegistrationGroups(
            @Param("academicYearId") Long academicYearId,
            @Param("termId") Long termId,
            @Param("status") String status,
            @Param("groupQuery") String groupQuery
    );

    @EntityGraph(attributePaths = {
            "academicYear",
            "term",
            "registrationGroupGeneration",
            "registrationGroupGeneration.academicYear",
            "registrationGroupGeneration.term",
            "registrationGroupGeneration.academicDivision"
    })
    @Query("""
            select registrationGroup
            from RegistrationGroup registrationGroup
            where registrationGroup.id = :registrationGroupId
            """)
    Optional<RegistrationGroup> findRegistrationGroupDetail(
            @Param("registrationGroupId") Long registrationGroupId
    );

    @Modifying
    @Query("""
            update RegistrationGroup registrationGroup
            set registrationGroup.status = 'CLOSED'
            where upper(registrationGroup.status) = 'PUBLISHED'
              and registrationGroup.registrationClosesAt is not null
              and registrationGroup.registrationClosesAt <= :now
            """)
    int closeExpiredPublishedGroups(@Param("now") LocalDateTime now);
}
