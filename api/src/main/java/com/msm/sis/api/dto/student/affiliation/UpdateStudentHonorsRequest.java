package com.msm.sis.api.dto.student.affiliation;

import jakarta.validation.constraints.NotNull;

public record UpdateStudentHonorsRequest(
        @NotNull
        Boolean active
) {
}
