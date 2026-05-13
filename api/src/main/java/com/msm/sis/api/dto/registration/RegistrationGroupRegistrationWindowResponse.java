package com.msm.sis.api.dto.registration;

import java.time.LocalDateTime;

public record RegistrationGroupRegistrationWindowResponse(
        LocalDateTime opensAt,
        LocalDateTime closesAt
) {
}
