package com.msm.sis.api.dto.academic.year;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AcademicYearResponse(

        Long academicYearId,

        String code,

        String name,

        LocalDate startDate,

        LocalDate endDate,

        boolean active,

        boolean isPublished,

        LocalDateTime lastUpdated,

        String updatedBy,

        List<AcademicTermResponse> terms

) {
}
