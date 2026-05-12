package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;

public record StudentCourseRegistrationScheduleMeetingResponse(
        String id,
        String sourceType,
        Long sourceRecordId,
        String registrationStatus,
        Long sectionId,
        Long courseId,
        Long courseVersionId,
        Long courseOfferingId,
        String courseCode,
        String courseTitle,
        String sectionLetter,
        String displaySectionCode,
        String sectionTitle,
        Long termId,
        String termCode,
        String termName,
        Long subTermId,
        String subTermCode,
        String subTermName,
        Long sectionMeetingId,
        Short dayOfWeek,
        @JsonFormat(pattern = "HH:mm:ss")
        LocalTime startTime,
        @JsonFormat(pattern = "HH:mm:ss")
        LocalTime endTime,
        String building,
        String room,
        String location
) {
}
