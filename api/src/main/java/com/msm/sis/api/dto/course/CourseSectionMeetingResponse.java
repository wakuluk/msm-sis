package com.msm.sis.api.dto.course;

import java.time.LocalDate;
import java.time.LocalTime;

public record CourseSectionMeetingResponse(
        Long sectionMeetingId,
        Long meetingTypeId,
        String meetingTypeCode,
        String meetingTypeName,
        Short dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        String building,
        String room,
        LocalDate startDate,
        LocalDate endDate,
        Integer sequenceNumber
) {
}
