package com.msm.sis.api.dto.program;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record ProgramSearchResultResponse(
        Long programId,
        Long programTypeId,
        String programTypeCode,
        String programTypeName,
        Long degreeTypeId,
        String degreeTypeCode,
        String degreeTypeName,
        Long schoolId,
        String schoolCode,
        String schoolName,
        Long departmentId,
        String departmentCode,
        String departmentName,
        String code,
        String name,
        String description,
        Integer currentVersionNumber,
        Boolean currentVersionPublished,
        Integer currentClassYearStart,
        Integer currentClassYearEnd,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime updatedAt
) {
}
