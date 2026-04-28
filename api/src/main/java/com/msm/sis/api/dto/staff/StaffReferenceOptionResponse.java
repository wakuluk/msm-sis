package com.msm.sis.api.dto.staff;

public record StaffReferenceOptionResponse(
        Long staffId,
        String firstName,
        String lastName,
        String email,
        String displayName
) {
}
