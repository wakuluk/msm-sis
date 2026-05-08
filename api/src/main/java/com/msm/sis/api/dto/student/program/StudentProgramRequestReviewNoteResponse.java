package com.msm.sis.api.dto.student.program;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record StudentProgramRequestReviewNoteResponse(
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime reviewedAt,
        String reviewedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime signatureAt,
        String signatureName,
        String signatureEmail,
        String comment
) {
}
