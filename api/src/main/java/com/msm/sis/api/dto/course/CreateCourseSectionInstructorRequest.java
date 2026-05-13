package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCourseSectionInstructorRequest(
        @NotNull
        Long staffId,

        @Size(max = 50)
        String roleCode,

        Boolean canViewGrades,

        Boolean canManageGrades
) {
}
