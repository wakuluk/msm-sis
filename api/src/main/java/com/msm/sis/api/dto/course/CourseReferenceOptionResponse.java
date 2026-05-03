package com.msm.sis.api.dto.course;

import java.math.BigDecimal;

public record CourseReferenceOptionResponse(
        Long courseId,
        Long schoolId,
        String schoolCode,
        String schoolName,
        Long departmentId,
        String departmentCode,
        String departmentName,
        Long subjectId,
        String subjectCode,
        String subjectName,
        String courseNumber,
        String courseCode,
        boolean lab,
        Long currentCourseVersionId,
        String currentVersionTitle,
        BigDecimal minCredits,
        BigDecimal maxCredits,
        boolean variableCredit
) {
}
