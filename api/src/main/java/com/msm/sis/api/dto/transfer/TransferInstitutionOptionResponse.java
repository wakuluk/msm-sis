package com.msm.sis.api.dto.transfer;

public record TransferInstitutionOptionResponse(
        Long transferInstitutionId,
        String code,
        String name,
        String institutionLevel,
        String addressLine1,
        String addressLine2,
        String city,
        String stateRegion,
        String postalCode,
        String countryCode,
        String website
) {
}
