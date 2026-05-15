package com.msm.sis.api.dto.transfer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record StudentTransferRequestSubmissionRequest(
        @Valid
        @NotNull
        StudentTransferRequestInstitutionRequest institution,
        @Valid
        @NotNull
        StudentTransferRequestCourseRequest course
) {
}
