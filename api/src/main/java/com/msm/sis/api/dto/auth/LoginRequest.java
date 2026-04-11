package com.msm.sis.api.dto.auth;

public record LoginRequest(
        String email,
        String password
) {
}
