package com.msm.sis.api.service.registration;

import java.util.List;

public record StudentCourseRequisiteValidationResult(
        Long courseVersionId,
        List<String> corequisiteWarnings
) {
}
