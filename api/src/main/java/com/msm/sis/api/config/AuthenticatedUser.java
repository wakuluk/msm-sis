package com.msm.sis.api.config;

import java.util.List;

public record AuthenticatedUser(
        Long userId,
        String email,
        List<String> roles
) {
    public boolean hasRole(String roleName) {
        return roles != null && roles.contains(roleName);
    }

    public boolean hasAnyRole(String... roleNames) {
        if (roles == null) {
            return false;
        }

        for (String roleName : roleNames) {
            if (roles.contains(roleName)) {
                return true;
            }
        }

        return false;
    }
}
