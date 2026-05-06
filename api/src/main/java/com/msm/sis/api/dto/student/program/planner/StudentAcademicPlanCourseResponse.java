package com.msm.sis.api.dto.student.program.planner;

import java.math.BigDecimal;
import java.util.List;

public record StudentAcademicPlanCourseResponse(
        Long studentAcademicPlanCourseId,
        Long courseId,
        Long studentProgramId,
        Long requirementId,
        String subjectCode,
        String courseNumber,
        String courseCode,
        String title,
        BigDecimal credits,
        String plannerBucketCode,
        String plannerBucketLabel,
        String placeholderType,
        String placeholderLabel,
        String placeholderSubjectCode,
        Long placeholderDepartmentId,
        String placeholderDepartmentCode,
        Integer placeholderMinimumCourseNumber,
        Integer placeholderMaximumCourseNumber,
        String requirementName,
        String programCode,
        String programName,
        String status,
        Integer sortOrder,
        String notes,
        String source,
        boolean readOnly,
        String gradeCode,
        String completedDate,
        List<String> warnings
) {
}
