package com.msm.sis.api.dto.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record CourseSectionStudentWaitlistOfferResponse(
        Long waitlistOfferId,
        String status,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime offeredAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime expiresAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime notificationSentAt
) {
}
