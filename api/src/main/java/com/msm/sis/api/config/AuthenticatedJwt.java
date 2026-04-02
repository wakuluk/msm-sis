package com.msm.sis.api.config;

import lombok.Getter;

import java.util.List;

@Getter
public final class AuthenticatedJwt {

    private final Long userId;
    private final String email;
    private final List<String> roles;

    public AuthenticatedJwt(Long userId, String email, List<String> roles) {
        this.userId = userId;
        this.email = email;
        this.roles = roles;
    }

    public String getUsername() {
        return email;
    }
}
