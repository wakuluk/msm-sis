package com.msm.sis.api.dto.student.program;

import java.util.List;

public record StudentProgramCompletionRequirementResponse(
        Long programVersionCompletionRequirementId,
        Integer minimumCount,
        Integer sortOrder,
        String notes,
        boolean satisfied,
        Integer matchedCount,
        Integer completedCount,
        Integer plannedCount,
        String status,
        List<StudentProgramCompletionRequirementOptionResponse> options
) {
}
