package com.msm.sis.api.dto.registration;

import java.math.BigDecimal;
import java.util.List;

public record RegistrationGroupBuilderPreviewGroupResponse(
        String temporaryGroupId,
        String name,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        int studentCount,
        BigDecimal totalCredits,
        List<RegistrationGroupBuilderPreviewStudentResponse> students
) {
}
