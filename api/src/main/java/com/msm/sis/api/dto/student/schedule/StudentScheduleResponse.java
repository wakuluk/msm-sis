package com.msm.sis.api.dto.student.schedule;

import java.util.List;

public record StudentScheduleResponse(
        Long studentId,
        String studentDisplayName,
        Long selectedTermId,
        List<StudentScheduleTermOptionResponse> terms,
        List<StudentScheduleCourseResponse> scheduledCourses,
        List<StudentScheduleHistoricalCourseResponse> notOnScheduleCourses,
        List<StudentScheduleMeetingResponse> scheduleMeetings
) {
}
