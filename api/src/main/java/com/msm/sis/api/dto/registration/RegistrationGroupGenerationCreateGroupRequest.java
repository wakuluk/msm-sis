package com.msm.sis.api.dto.registration;

import java.time.LocalDateTime;
import java.util.List;

public record RegistrationGroupGenerationCreateGroupRequest(
        String temporaryGroupId,
        String name,
        LocalDateTime registrationOpensAt,
        LocalDateTime registrationClosesAt,
        Integer sortOrder,
        List<Long> studentIds
) {
}
