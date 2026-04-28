package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateCourseSectionInstructorRequest(
        @NotNull
        Long staffId,

        @Size(max = 50)
        String roleCode,

        boolean primary,

        LocalDate assignmentStartDate,

        LocalDate assignmentEndDate
) {
}
