package com.msm.sis.api.service.student;

import java.time.LocalDate;
import java.util.List;

public record StudentCompletedCourseTimelineYear(
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        LocalDate academicYearStartDate,
        LocalDate academicYearEndDate,
        Integer sortOrder,
        List<StudentCompletedCourseTimelineTerm> terms
) {
}
