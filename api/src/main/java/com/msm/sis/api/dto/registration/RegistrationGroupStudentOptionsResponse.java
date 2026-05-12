package com.msm.sis.api.dto.registration;

import java.util.List;

public record RegistrationGroupStudentOptionsResponse(
        List<RegistrationGroupStudentOptionResponse> results
) {
}
