package com.msm.sis.api.dto.course;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateCourseOfferingRequest(
        @NotNull
        Long courseId,

        @NotEmpty
        List<@NotNull Long> termIds,

        @Size(max = 500)
        String notes
) {
}
