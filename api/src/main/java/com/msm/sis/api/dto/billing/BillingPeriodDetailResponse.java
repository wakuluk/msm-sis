package com.msm.sis.api.dto.billing;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BillingPeriodDetailResponse(
        Long billingPeriodId,
        String name,
        String description,
        String type,
        String status,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate actualStartPreliminaryEndDate,
        String taxAcademicYear,
        String taxAcademicYearLabel,
        String taxAcademicTermCode,
        String taxAcademicTermName,
        String financialAidPeriodCode,
        String financialAidPeriodName,
        String courseBillingBasis,
        String nonCourseBillingBasis,
        Integer actualFromToDays,
        Integer preliminaryFromToDays,
        boolean active,
        boolean allowReBilling,
        boolean allowArBilling,
        boolean includeInArStatements,
        boolean allowBillingInCampusPortal,
        boolean runPrelimInCampusPortalOnly,
        boolean academicRecordsMapped,
        boolean childrenAssigned,
        Long createdByUserId,
        String createdByUserEmail,
        Long updatedByUserId,
        String updatedByUserEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
