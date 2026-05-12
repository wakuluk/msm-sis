package com.msm.sis.api.dto.registration;

public record RegistrationGroupSearchPageResponse(
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
