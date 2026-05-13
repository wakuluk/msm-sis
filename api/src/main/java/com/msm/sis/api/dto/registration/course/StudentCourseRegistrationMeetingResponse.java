package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalTime;

public record StudentCourseRegistrationMeetingResponse(
        Long sectionMeetingId,
        Long meetingTypeId,
        String meetingTypeCode,
        String meetingTypeName,
        Short dayOfWeek,
        @JsonFormat(pattern = "HH:mm:ss")
        LocalTime startTime,
        @JsonFormat(pattern = "HH:mm:ss")
        LocalTime endTime,
        String building,
        String room,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        Integer sequenceNumber
) {
}
