package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record StudentCourseRegistrationSubTermResponse(
        Long subTermId,
        String subTermCode,
        String subTermName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        Integer sortOrder
) {
}
