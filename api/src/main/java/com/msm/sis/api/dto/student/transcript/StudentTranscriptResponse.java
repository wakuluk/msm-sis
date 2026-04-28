package com.msm.sis.api.dto.student.transcript;

import java.util.List;

public record StudentTranscriptResponse(
        Long studentId,
        String studentNumber,
        String studentName,
        List<StudentTranscriptTermResponse> terms,
        StudentTranscriptCumulativeSummaryResponse cumulativeSummary
) {
}
