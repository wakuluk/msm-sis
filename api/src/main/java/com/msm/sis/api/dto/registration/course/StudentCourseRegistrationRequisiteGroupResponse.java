package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record StudentCourseRegistrationRequisiteGroupResponse(
        Long groupId,
        String requisiteType,
        String conditionType,
        Integer minimumRequired,
        String minimumGradeSummary,
        String status,
        String title,
        List<StudentCourseRegistrationRequisiteCourseResponse> courses
) {
}
