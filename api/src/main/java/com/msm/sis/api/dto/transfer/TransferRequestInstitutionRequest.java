package com.msm.sis.api.dto.transfer;

public record TransferRequestInstitutionRequest(
        Long transferInstitutionId,
        String oneOffInstitutionName,
        String oneOffInstitutionAddressLine1,
        String oneOffInstitutionAddressLine2,
        String oneOffInstitutionCity,
        String oneOffInstitutionStateRegion,
        String oneOffInstitutionPostalCode,
        String oneOffInstitutionCountryCode,
        String oneOffInstitutionWebsite,
        String institutionLevel
) {
}
