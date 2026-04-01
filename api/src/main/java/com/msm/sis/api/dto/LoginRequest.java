package com.msm.sis.api.dto;

public record LoginRequest(
        String email,
        String password
) {
}
