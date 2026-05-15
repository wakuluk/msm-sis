package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.NotNull;

public record CreateTransferRequestRequest(
        @NotNull
        Long studentId,
        TransferRequestInstitutionRequest institution,
        TransferRequestCourseRequest course
) {
}
