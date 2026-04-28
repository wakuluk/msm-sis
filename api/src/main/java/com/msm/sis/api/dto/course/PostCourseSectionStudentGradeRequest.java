package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostCourseSectionStudentGradeRequest(
        @NotBlank
        @Size(max = 50)
        String gradeTypeCode,

        @NotBlank
        @Size(max = 20)
        String gradeMarkCode
) {
}
