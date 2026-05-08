package com.msm.sis.api.dto.program;

import java.util.List;

public record ProgramVersionCompletionRequirementResponse(
        Long programVersionCompletionRequirementId,
        Integer minimumCount,
        Integer sortOrder,
        String notes,
        List<ProgramVersionCompletionRequirementOptionResponse> options
) {
}
