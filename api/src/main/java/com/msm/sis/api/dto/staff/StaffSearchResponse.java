package com.msm.sis.api.dto.staff;

import java.util.List;

public record StaffSearchResponse(
        List<StaffReferenceOptionResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
