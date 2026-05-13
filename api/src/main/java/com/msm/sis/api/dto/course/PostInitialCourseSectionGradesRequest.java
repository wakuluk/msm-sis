package com.msm.sis.api.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PostInitialCourseSectionGradesRequest(
        @NotEmpty
        List<@Valid InitialCourseSectionGradeRequest> grades
) {
}
