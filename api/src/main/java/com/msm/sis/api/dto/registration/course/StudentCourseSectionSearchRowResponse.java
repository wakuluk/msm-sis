package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
public record StudentCourseSectionSearchRowResponse(
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
        Long academicDivisionId,
        String academicDivisionCode,
        String academicDivisionName,
        BigDecimal credits,
        boolean honors,
        Integer capacity,
        Integer hardCapacity,
        Integer enrolledCount,
        Integer waitlistCount,
        Integer seatsAvailable,
        String instructorSummary,
        String meetingSummary
) {
}
