package com.msm.sis.api.dto.transfer;

import java.util.List;

public record TransferRequestMappingComparisonResponse(
        Long transferRequestId,
        Long transferInstitutionId,
        String transferInstitutionName,
        Long previousTransferCourseEquivalencyId,
        TransferRequestMappingComparisonCourseResponse transferCourse,
        List<TransferRequestMappingComparisonOutcomeResponse> previousOutcomes,
        List<TransferRequestMappingComparisonOutcomeResponse> proposedOutcomes
) {
}
