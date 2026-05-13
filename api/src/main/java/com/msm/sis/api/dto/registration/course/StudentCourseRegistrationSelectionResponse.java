package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record StudentCourseRegistrationSelectionResponse(
        Long selectionId,
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
        Long statusId,
        String statusCode,
        String statusName,
        Long gradingBasisId,
        String gradingBasisCode,
        String gradingBasisName,
        Long selectedGradingBasisId,
        String selectedGradingBasisCode,
        String selectedGradingBasisName,
        BigDecimal credits,
        BigDecimal selectedCredits,
        boolean honors,
        Integer capacity,
        Integer hardCapacity,
        boolean waitlistAllowed,
        Integer enrolledCount,
        Integer waitlistCount,
        String instructorSummary,
        String meetingSummary,
        String roomSummary,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt,
        List<StudentCourseRegistrationRequisiteResponse> requisites,
        List<StudentCourseRegistrationRequisiteGroupResponse> requisiteGroups,
        List<String> corequisiteWarnings,
        String honorsWarningMessage,
        List<StudentCourseRegistrationMeetingResponse> meetings
) {
}
