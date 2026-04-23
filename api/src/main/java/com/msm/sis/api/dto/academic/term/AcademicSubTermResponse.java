package com.msm.sis.api.dto.academic.term;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AcademicSubTermResponse(
        Long subTermId,
        Long academicYearId,
        String code,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        Integer sortOrder,
        String subTermStatusCode,
        String subTermStatusName,
        boolean active,
        long courseOfferingCount,
        LocalDateTime lastUpdated,
        String updatedBy
) {
}
