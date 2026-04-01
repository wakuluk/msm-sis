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

@Service
public class AuthService {

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

    public LoginResponse login(LoginRequest loginRequest) {
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
