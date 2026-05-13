package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InitialCourseSectionGradeRequest(
        @NotNull
        Long enrollmentId,

        @NotBlank
        @Size(max = 50)
        String gradeTypeCode,

        @NotBlank
        @Size(max = 20)
        String gradeMarkCode
) {
}
