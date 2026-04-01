package com.msm.sis.api.tools;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

public final class PasswordHashTool {

    private PasswordHashTool() {
    }

    public static void main(String[] args) {
        if (args.length != 1 || args[0] == null || args[0].isBlank()) {
            System.err.println("Usage: ./gradlew printPasswordHash --args=\"YourPasswordHere\"");
            System.exit(1);
        }

        Argon2PasswordEncoder passwordEncoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
        String passwordHash = passwordEncoder.encode(args[0]);
        System.out.println(passwordHash);
    }
}
