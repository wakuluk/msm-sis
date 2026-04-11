package com.msm.sis.api.dto.auth;

import java.util.List;

public record CurrentUserResponse(
        String username,
        List<String> roles
) {
}
