package com.msm.sis.api.dto.student.academiccareer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record StudentAcademicCareerResponse(
        Long studentAcademicCareerId,
        Long studentId,
        Long academicCareerId,
        String academicCareerCode,
        String academicCareerName,
        String status,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate effectiveStartDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate effectiveEndDate,
        boolean primaryCareer,
        String entryReason,
        String notes,
        List<AcademicCareerRegistrationDivisionResponse> registrationDivisions,
        Long createdByUserId,
        String createdByUserEmail,
        Long updatedByUserId,
        String updatedByUserEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
