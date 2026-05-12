package com.msm.sis.api.dto.student.schedule;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StudentScheduleCourseResponse(
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
        String instructorSummary,
        String meetingSummary,
        String roomSummary,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate
) {
}
