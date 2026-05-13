package com.msm.sis.api.dto.student.schedule;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record StudentScheduleHistoricalCourseResponse(
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
        String courseCode,
        String courseTitle,
        String sectionLetter,
        String displaySectionCode,
        String sectionTitle,
        Long enrollmentStatusId,
        String enrollmentStatusCode,
        String enrollmentStatusName,
        BigDecimal creditsAttempted,
        BigDecimal creditsEarned,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate effectiveDate,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime statusChangedAt
) {
}
