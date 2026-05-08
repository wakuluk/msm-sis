package com.msm.sis.api.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAssociatedLabCourseRequest(
        @NotBlank
        @Size(max = 20)
        String courseNumber,

        Boolean active,

        boolean bidirectionalCorequisite,

        @Valid
        @NotNull
        CreateCourseVersionRequest initialVersion
) {
}
