package com.msm.sis.api.dto.instructor.schedule;

import com.msm.sis.api.dto.course.CourseSectionMeetingResponse;

import java.math.BigDecimal;
import java.util.List;

public record InstructorScheduleSearchResultResponse(
        Long sectionInstructorId,
        Long staffId,
        Long instructorUserId,
        String instructorName,
        String instructorEmail,
        Long sectionId,
        Long courseOfferingId,
        String sectionLetter,
        String displaySectionCode,
        String sectionTitle,
        boolean honors,
        String statusCode,
        String statusName,
        Long courseId,
        String courseCode,
        String courseTitle,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        Long subTermId,
        String subTermCode,
        String subTermName,
        Long schoolId,
        String schoolCode,
        String schoolName,
        Long departmentId,
        String departmentCode,
        String departmentName,
        String roleCode,
        String roleName,
        boolean primary,
        boolean canViewGrades,
        boolean canManageGrades,
        String deliveryModeCode,
        String deliveryModeName,
        BigDecimal credits,
        String meetingSummary,
        String roomSummary,
        List<CourseSectionMeetingResponse> meetings
) {
}
