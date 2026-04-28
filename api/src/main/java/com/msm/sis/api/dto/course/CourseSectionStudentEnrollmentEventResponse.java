package com.msm.sis.api.dto.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record CourseSectionStudentEnrollmentEventResponse(
        Long eventId,
        Long enrollmentId,
        String eventType,
        Long fromStatusId,
        String fromStatusCode,
        String fromStatusName,
        Long toStatusId,
        String toStatusCode,
        String toStatusName,
        Long actorUserId,
        String actorEmail,
        String reason,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt
) {
}
