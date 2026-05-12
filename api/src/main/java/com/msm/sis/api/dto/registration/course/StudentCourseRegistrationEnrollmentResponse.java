package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record StudentCourseRegistrationEnrollmentResponse(
        Long enrollmentId,
        Long sectionId,
        Long courseId,
        Long courseVersionId,
        Long courseOfferingId,
        Long termId,
        String termCode,
        String termName,
        Long subTermId,
        String subTermCode,
        String subTermName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate subTermStartDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate subTermEndDate,
        String courseCode,
        String courseTitle,
        String sectionLetter,
        String displaySectionCode,
        String sectionTitle,
        Long enrollmentStatusId,
        String enrollmentStatusCode,
        String enrollmentStatusName,
        Long gradingBasisId,
        String gradingBasisCode,
        String gradingBasisName,
        BigDecimal creditsAttempted,
        BigDecimal creditsEarned,
        Integer waitlistPosition,
        Integer capacity,
        Integer hardCapacity,
        Integer enrolledCount,
        Integer waitlistCount,
        Long waitlistOfferId,
        String waitlistOfferStatus,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime waitlistOfferExpiresAt,
        String instructorSummary,
        String meetingSummary,
        String roomSummary,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime registeredAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime waitlistedAt,
        List<StudentCourseRegistrationRequisiteResponse> requisites,
        List<StudentCourseRegistrationMeetingResponse> meetings
) {
}
