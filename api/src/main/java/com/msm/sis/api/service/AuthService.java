package com.msm.sis.api.service;

import com.msm.sis.api.dto.LoginRequest;
import com.msm.sis.api.dto.LoginResponse;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.repository.SisUserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Authenticates a user against the stored credential hash and issues an access token.
 */
@Service
public class  AuthService {

    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SisUserRepository sisUserRepository;

    public AuthService(
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            SisUserRepository sisUserRepository
    ) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.sisUserRepository = sisUserRepository;
    }

    /**
     * Validates email/password credentials and returns the JWT payload the client
     * needs for authenticated API calls.
     */
    public LoginResponse login(LoginRequest loginRequest) {
        // Normalize null and whitespace-only input so bad requests fail consistently.
        String email = loginRequest.email() == null ? "" : loginRequest.email().trim();
        String password = loginRequest.password() == null ? "" : loginRequest.password();

        if (email.isEmpty() || password.isEmpty()) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        SisUser sisUser = sisUserRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!sisUser.isEnabled()) {
            throw new BadCredentialsException("User account is disabled.");
        }

        if (!passwordEncoder.matches(password, sisUser.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        // Stable role ordering keeps the login response and token claims predictable.
        List<String> roles = sisUser.getRoles().stream()
                .map(role -> role.getName())
                .sorted(Comparator.naturalOrder())
                .toList();

        String token = jwtService.createToken(sisUser, roles);

        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                sisUser.getEmail(),
                roles
        );
    }
}
