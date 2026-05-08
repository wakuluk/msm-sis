package com.msm.sis.api.dto.student.program.request;

public record ProgramRequestProgramVersionOptionResponse(
        Long programVersionId,
        Integer versionNumber,
        Integer classYearStart,
        Integer classYearEnd,
        boolean published
) {
}
