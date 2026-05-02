package com.msm.sis.api.dto.course;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CourseSectionDetailResponse(
        Long sectionId,
        Long courseOfferingId,
        Long subTermId,
        Long courseId,
        Long courseVersionId,
        String courseCode,
        String courseTitle,
        String sectionLetter,
        String displaySectionCode,
        String title,
        boolean honors,
        boolean lab,
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
        Integer capacity,
        Integer hardCapacity,
        boolean waitlistAllowed,
        LocalDate startDate,
        LocalDate endDate,
        Long parentSectionId,
        String linkedGroupCode,
        String notes,
        CourseSectionEnrollmentSummaryResponse enrollmentSummary,
        List<CourseSectionInstructorResponse> instructors,
        List<CourseSectionMeetingResponse> meetings
) {
}
