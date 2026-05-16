package com.msm.sis.api.dto.billing;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateBillingPeriodRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 64, message = "Name must be 64 characters or fewer.")
        String name,

        @NotBlank(message = "Description is required.")
        @Size(max = 255, message = "Description must be 255 characters or fewer.")
        String description,

        @NotBlank(message = "Type is required.")
        @Size(max = 32, message = "Type must be 32 characters or fewer.")
        String type,

        @NotBlank(message = "Status is required.")
        @Size(max = 32, message = "Status must be 32 characters or fewer.")
        String status,

        @Positive(message = "Academic year id must be positive.")
        Long academicYearId,

        @Positive(message = "Academic term id must be positive.")
        Long termId,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate actualStartPreliminaryEndDate,

        @Size(max = 32, message = "1098-T academic year must be 32 characters or fewer.")
        String taxAcademicYear,

        @Size(max = 64, message = "1098-T academic year label must be 64 characters or fewer.")
        String taxAcademicYearLabel,

        @Size(max = 32, message = "1098-T academic term code must be 32 characters or fewer.")
        String taxAcademicTermCode,

        @Size(max = 128, message = "1098-T academic term name must be 128 characters or fewer.")
        String taxAcademicTermName,

        @Size(max = 64, message = "Financial aid period code must be 64 characters or fewer.")
        String financialAidPeriodCode,

        @Size(max = 128, message = "Financial aid period name must be 128 characters or fewer.")
        String financialAidPeriodName,

        @Size(max = 64, message = "Course billing basis must be 64 characters or fewer.")
        String courseBillingBasis,

        @Size(max = 64, message = "Non-course billing basis must be 64 characters or fewer.")
        String nonCourseBillingBasis,
        Integer actualFromToDays,
        Integer preliminaryFromToDays,
        Boolean active,
        Boolean allowReBilling,
        Boolean allowArBilling,
        Boolean includeInArStatements,
        Boolean allowBillingInCampusPortal,
        Boolean runPrelimInCampusPortalOnly,
        Boolean academicRecordsMapped,
        Boolean childrenAssigned
) {
}
