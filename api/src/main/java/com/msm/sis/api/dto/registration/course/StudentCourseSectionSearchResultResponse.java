package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record StudentCourseSectionSearchResultResponse(
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
        Long academicDivisionId,
        String academicDivisionCode,
        String academicDivisionName,
        Long deliveryModeId,
        String deliveryModeCode,
        String deliveryModeName,
        Long gradingBasisId,
        String gradingBasisCode,
        String gradingBasisName,
        BigDecimal credits,
        boolean honors,
        Integer capacity,
        Integer hardCapacity,
        boolean waitlistAllowed,
        Integer enrolledCount,
        Integer waitlistCount,
        Integer seatsAvailable,
        String instructorSummary,
        String meetingSummary,
        String roomSummary,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        boolean alreadySelected,
        boolean alreadyEnrolled,
        boolean sameCourseAlreadySelected,
        boolean sameCourseAlreadyEnrolled,
        String duplicateCourseReason,
        boolean prerequisitesSatisfied,
        boolean registrationEligibilitySatisfied,
        String registrationEligibilityMessage,
        boolean honorsEligibilitySatisfied,
        String honorsEligibilityMessage,
        String honorsWarningMessage,
        String unavailableReason,
        List<StudentCourseRegistrationRequisiteResponse> requisites,
        List<StudentCourseRegistrationRequisiteGroupResponse> requisiteGroups,
        List<String> corequisiteWarnings,
        List<StudentCourseRegistrationMeetingResponse> meetings
) {
}
