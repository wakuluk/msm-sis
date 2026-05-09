package com.msm.sis.api.dto.instructor.schedule;

import java.time.LocalDate;
import java.util.List;

public record InstructorScheduleTermOptionResponse(
        Long id,
        String code,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        List<InstructorScheduleSubTermOptionResponse> subTerms
) {
}
