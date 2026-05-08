package com.msm.sis.api.dto.student.program;

public record StudentProgramCompletionRequirementOptionResponse(
        Long programVersionCompletionRequirementOptionId,
        Long requiredProgramTypeId,
        String requiredProgramTypeCode,
        String requiredProgramTypeName,
        Long requiredProgramId,
        String requiredProgramCode,
        String requiredProgramName,
        Long requiredProgramVersionId,
        Integer requiredProgramVersionNumber,
        String requiredProgramVersionProgramCode,
        String requiredProgramVersionProgramName,
        boolean satisfied,
        Integer matchedCount,
        Integer completedCount,
        Integer plannedCount,
        String status
) {
}
