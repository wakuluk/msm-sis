package com.msm.sis.api.dto.program;

public record ProgramVersionCompletionRequirementOptionResponse(
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
        String requiredProgramVersionProgramName
) {
}
