package com.msm.sis.api.dto.student.program;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record StudentProgramResponse(
        Long studentProgramId,
        Long programId,
        Long programVersionId,
        String programCode,
        String programName,
        String programTypeCode,
        String programTypeName,
        String degreeTypeCode,
        String degreeTypeName,
        Integer versionNumber,
        Integer classYearStart,
        Integer classYearEnd,
        String status,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate declaredDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate completedDate,
        BigDecimal completed,
        BigDecimal planned,
        BigDecimal required,
        String progressUnit,
        List<StudentCompletionRequirementResponse> requirements,
        List<StudentProgramCompletionRequirementResponse> completionRequirements
) {
}
