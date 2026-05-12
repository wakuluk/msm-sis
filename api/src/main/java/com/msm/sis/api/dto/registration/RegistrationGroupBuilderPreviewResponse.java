package com.msm.sis.api.dto.registration;

import java.util.List;

public record RegistrationGroupBuilderPreviewResponse(
        int matchingStudentCount,
        int splitCount,
        List<RegistrationGroupBuilderPreviewGroupResponse> groups
) {
}
