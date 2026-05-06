package com.msm.sis.api.service.student;

import java.time.LocalDate;
import java.util.List;

public record StudentCompletedCourseTimelineTerm(
        Long termId,
        String termCode,
        String termName,
        LocalDate termStartDate,
        LocalDate termEndDate,
        Integer termSortOrder,
        LocalDate termSortDate,
        List<StudentCompletedCourseTimelineCourse> courses
) {
}
