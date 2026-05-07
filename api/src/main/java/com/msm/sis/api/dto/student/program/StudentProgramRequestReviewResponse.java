package com.msm.sis.api.dto.student.program;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record StudentProgramRequestReviewResponse(
        Long studentProgramRequestId,
        String status,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime requestedAt,
        StudentProgramRequestReviewNoteResponse departmentReview,
        StudentProgramRequestReviewNoteResponse adminReview
) {
}
