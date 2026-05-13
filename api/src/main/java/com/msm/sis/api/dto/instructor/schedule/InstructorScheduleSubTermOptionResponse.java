package com.msm.sis.api.dto.instructor.schedule;

import java.time.LocalDate;

public record InstructorScheduleSubTermOptionResponse(
        Long id,
        String code,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        Integer sortOrder
) {
}
