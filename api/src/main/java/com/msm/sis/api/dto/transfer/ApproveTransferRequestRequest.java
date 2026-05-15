package com.msm.sis.api.dto.transfer;

public record ApproveTransferRequestRequest(
        String decisionNotes,
        Boolean saveInstitution,
        Boolean saveOrUpdateInstitutionMapping
) {
}
