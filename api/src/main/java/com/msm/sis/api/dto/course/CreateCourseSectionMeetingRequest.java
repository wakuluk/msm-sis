package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateCourseSectionMeetingRequest(
        @Size(max = 50)
        String meetingTypeCode,

        @Min(1)
        @Max(7)
        Short dayOfWeek,

        LocalTime startTime,

        LocalTime endTime,

        @Size(max = 100)
        String building,

        @Size(max = 50)
        String room,

        LocalDate startDate,

        LocalDate endDate,

        Integer sequenceNumber
) {
}
