package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseOffering;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CourseOfferingRepositoryCustom {

    Page<CourseOffering> searchCourseOfferings(
            String academicYearCode,
            String subTermCode,
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
            List<String> subTermStatusCodes,
            boolean includeInactive,
            Boolean isPublished,
            Pageable pageable
    );

    Optional<CourseOffering> findPublicVisibleById(
            Long courseOfferingId,
            List<String> offeringStatusCodes,
            List<String> subTermStatusCodes
    );
}
