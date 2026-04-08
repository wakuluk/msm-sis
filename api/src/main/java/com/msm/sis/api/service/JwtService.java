package com.msm.sis.api.service;

import com.msm.sis.api.entity.SisUser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Creates signed JWT access tokens using the configured application secret.
 */
@Service
public class JwtService {

    private final SecretKey secretKey;
    @Getter
    private final long expirationSeconds;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration-seconds}") long expirationSeconds
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = expirationSeconds;
    }

    /**
     * Builds a token whose subject is the user's email and whose claims carry the
     * app-specific identity and authorization data used by downstream security code.
     */
    public String createToken(SisUser sisUser, List<String> roles) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expirationSeconds);

        return Jwts.builder()
                // Subject stays human-readable while userId/roles remain explicit claims.
                .subject(sisUser.getEmail())
                .claim("userId", sisUser.getId())
                .claim("roles", roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

}
