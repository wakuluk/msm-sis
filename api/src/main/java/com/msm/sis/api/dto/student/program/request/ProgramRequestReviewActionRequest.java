package com.msm.sis.api.dto.student.program.request;

import jakarta.validation.constraints.Size;

public record ProgramRequestReviewActionRequest(
        Long programVersionId,
        @Size(max = 1000)
        String comment
) {
}
