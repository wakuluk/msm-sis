package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record TransferRequestInstitutionResponse(
        Long transferInstitutionId,
        String transferInstitutionName,
        String transferInstitutionAddressLine1,
        String transferInstitutionAddressLine2,
        String transferInstitutionCity,
        String transferInstitutionStateRegion,
        String transferInstitutionPostalCode,
        String transferInstitutionCountryCode,
        String transferInstitutionWebsite,
        Long institutionMatchedByUserId,
        String institutionMatchedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime institutionMatchedAt,
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
