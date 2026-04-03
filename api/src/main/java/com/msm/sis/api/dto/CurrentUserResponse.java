package com.msm.sis.api.dto;

import java.util.List;

public record CurrentUserResponse(
        String username,
        List<String> roles
) {
}
