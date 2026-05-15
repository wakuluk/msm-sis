package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferCourseEquivalency;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransferCourseEquivalencyRepository extends JpaRepository<TransferCourseEquivalency, Long> {

    @EntityGraph(attributePaths = {"transferInstitution"})
    @Query("""
            SELECT equivalency
            FROM TransferCourseEquivalency equivalency
            WHERE equivalency.transferInstitution.id = :transferInstitutionId
              AND equivalency.active = TRUE
              AND (
                    :searchPattern IS NULL
                    OR LOWER(COALESCE(equivalency.externalSubjectCode, '')) LIKE :searchPattern
                    OR LOWER(COALESCE(equivalency.externalCourseNumber, '')) LIKE :searchPattern
                    OR LOWER(COALESCE(equivalency.externalCourseTitle, '')) LIKE :searchPattern
                    OR LOWER(COALESCE(equivalency.notes, '')) LIKE :searchPattern
              )
            ORDER BY equivalency.externalSubjectCode ASC, equivalency.externalCourseNumber ASC, equivalency.id ASC
            """)
    List<TransferCourseEquivalency> findActiveByInstitutionAndSearch(
            @Param("transferInstitutionId") Long transferInstitutionId,
            @Param("searchPattern") String searchPattern
    );

    Optional<TransferCourseEquivalency> findFirstByTransferInstitution_IdAndExternalSubjectCodeAndExternalCourseNumberAndActiveTrueOrderByIdDesc(
            Long transferInstitutionId,
            String externalSubjectCode,
            String externalCourseNumber
    );
}
