package com.msm.sis.api.dto.student.transcript;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

public record StudentTranscriptTermResponse(
        String label,
        String source,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate sortDate,
        boolean midterm,
        List<StudentTranscriptCourseResponse> courses,
        StudentTranscriptSummaryResponse termSummary,
        StudentTranscriptSummaryResponse careerSummary
) {
}
