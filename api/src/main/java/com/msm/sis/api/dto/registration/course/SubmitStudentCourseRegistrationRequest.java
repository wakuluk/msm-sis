package com.msm.sis.api.dto.registration.course;

import java.util.List;

public record SubmitStudentCourseRegistrationRequest(
        List<Long> selectionIds,
        Boolean waitlistIfFull
) {
}
