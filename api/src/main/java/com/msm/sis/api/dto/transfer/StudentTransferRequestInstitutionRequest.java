package com.msm.sis.api.dto.transfer;

import jakarta.validation.constraints.NotBlank;

public record StudentTransferRequestInstitutionRequest(
        @NotBlank
        String oneOffInstitutionName,
        String oneOffInstitutionAddressLine1,
        String oneOffInstitutionAddressLine2,
        String oneOffInstitutionCity,
        String oneOffInstitutionStateRegion,
        String oneOffInstitutionPostalCode,
        String oneOffInstitutionCountryCode,
        String oneOffInstitutionWebsite
) {
}
