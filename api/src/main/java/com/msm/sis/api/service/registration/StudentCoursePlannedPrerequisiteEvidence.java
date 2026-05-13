package com.msm.sis.api.service.registration;

import java.time.LocalDate;

public record StudentCoursePlannedPrerequisiteEvidence(
        Long courseId,
        Long sectionId,
        Long subTermId,
        LocalDate subTermStartDate,
        LocalDate subTermEndDate,
        String source
) {
}
