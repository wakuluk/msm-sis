package com.msm.sis.api.dto.course;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CourseVersionDetailResponse(
        Long courseVersionId,
        Long courseId,
        Long subjectId,
        String subjectCode,
        String courseNumber,
        String courseCode,
        Integer versionNumber,
        String title,
        String catalogDescription,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean variableCredit,
        boolean current,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
