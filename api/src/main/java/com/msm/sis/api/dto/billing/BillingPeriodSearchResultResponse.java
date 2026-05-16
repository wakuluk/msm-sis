package com.msm.sis.api.dto.billing;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record BillingPeriodSearchResultResponse(
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
        String taxAcademicTermCode,
        String taxAcademicTermName,
        String financialAidPeriodCode,
        String financialAidPeriodName,
        boolean active
) {
}
