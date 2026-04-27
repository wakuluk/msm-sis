package com.msm.sis.api.dto.course;

import java.time.LocalDate;

public record CourseSectionInstructorResponse(
        Long sectionInstructorId,
        Long staffId,
        String firstName,
        String lastName,
        String email,
        Long roleId,
        String roleCode,
        String roleName,
        boolean primary,
        LocalDate assignmentStartDate,
        LocalDate assignmentEndDate
) {
}
