package com.msm.sis.api.dto.student.academiccareer;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateStudentAcademicCareerRequest(
        @NotNull(message = "Academic career is required.")
        Long academicCareerId,

        @NotBlank(message = "Status is required.")
        @Size(max = 30, message = "Status must be 30 characters or fewer.")
        String status,

        @NotNull(message = "Effective start date is required.")
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate effectiveStartDate,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate effectiveEndDate,

        Boolean primaryCareer,

        @Size(max = 50, message = "Entry reason must be 50 characters or fewer.")
        String entryReason,

        @Size(max = 500, message = "Notes must be 500 characters or fewer.")
        String notes
) {
}
