package com.msm.sis.api.dto.course;

import java.util.List;

public record CourseVersionRequisiteGroupResponse(
        Long courseVersionRequisiteGroupId,
        String requisiteType,
        String conditionType,
        Integer minimumRequired,
        Integer sortOrder,
        List<CourseVersionRequisiteCourseResponse> courses
) {
}
