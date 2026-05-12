package com.msm.sis.api.dto.student.schedule;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record StudentScheduleTermOptionResponse(
        Long termId,
        String termCode,
        String termName,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        boolean currentOrFuture,
        boolean selected
) {
}
