package com.msm.sis.api.dto.registration;

import java.util.List;

public record BulkAssignRegistrationGroupStudentsRequest(
        Long registrationGroupId,
        List<Long> studentIds
) {
}
