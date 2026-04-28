package com.msm.sis.api.dto.student.transcript;

public record StudentTranscriptCumulativeSummaryResponse(
        StudentTranscriptSummaryResponse transfer,
        StudentTranscriptSummaryResponse local,
        StudentTranscriptSummaryResponse career
) {
}
