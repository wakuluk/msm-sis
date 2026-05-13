package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record StudentCourseRegistrationGroupChoicesResponse(
        Long selectedRegistrationGroupId,
        List<StudentCourseRegistrationGroupChoiceResponse> groups
) {
}
