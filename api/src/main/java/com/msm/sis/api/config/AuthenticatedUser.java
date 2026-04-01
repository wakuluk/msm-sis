package com.msm.sis.api.config;

import java.util.List;

public record AuthenticatedUser(
        Long userId,
        String email,
        List<String> roles
) {
}
