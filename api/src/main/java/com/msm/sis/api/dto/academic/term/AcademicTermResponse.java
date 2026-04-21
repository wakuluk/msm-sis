package com.msm.sis.api.dto.academic.term;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AcademicTermResponse(
        Long termId,
        Long academicYearId,
        String code,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        Integer sortOrder,
        String termStatusCode,
        String termStatusName,
        boolean active,
        long courseOfferingCount,
        LocalDateTime lastUpdated,
        String updatedBy
) {
}
