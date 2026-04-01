package com.msm.sis.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Basic health endpoints")
@CrossOrigin(origins = "http://localhost:5173")
@SecurityRequirements
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Returns a simple status payload")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
