package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogCourseOffering;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CatalogCourseOfferingRepositoryCustom {

    Page<CatalogCourseOffering> searchCourseOfferings(
            String academicYearCode,
            String termCode,
            String departmentCode,
            String subjectCode,
            String courseNumber,
            String courseCode,
            String title,
            String description,
            BigDecimal minCredits,
            BigDecimal maxCredits,
            Boolean variableCredit,
            List<String> offeringStatusCodes,
            List<String> termStatusCodes,
            boolean includeInactive,
            Boolean isPublished,
            Pageable pageable
    );

    Optional<CatalogCourseOffering> findPublicVisibleById(
            Long courseOfferingId,
            List<String> offeringStatusCodes,
            List<String> termStatusCodes
    );
}
