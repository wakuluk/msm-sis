package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.athletics.AthleticSportListResponse;
import com.msm.sis.api.dto.athletics.AthleticSportResponse;
import com.msm.sis.api.dto.athletics.CreateAthleticSportRequest;
import com.msm.sis.api.dto.athletics.PatchAthleticSportRequest;
import com.msm.sis.api.service.athletics.AthleticSportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/athletics")
@Tag(name = "athletics", description = "Manage athletics reference data")
public class AthleticsController {

    private final AthleticSportService athleticSportService;

    public AthleticsController(AthleticSportService athleticSportService) {
        this.athleticSportService = athleticSportService;
    }

    @GetMapping("/sports")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List athletic sports", description = "Returns athletic sports for admin management")
    public ResponseEntity<AthleticSportListResponse> listSports() {
        return ResponseEntity.ok(athleticSportService.listSports());
    }

    @PostMapping("/sports")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create athletic sport", description = "Creates an athletic sport reference option")
    public ResponseEntity<AthleticSportResponse> createSport(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CreateAthleticSportRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                athleticSportService.createSport(request, jwt == null ? null : jwt.getUserId())
        );
    }

    @PatchMapping("/sports/{athleticSportId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch athletic sport", description = "Updates an athletic sport reference option")
    public ResponseEntity<AthleticSportResponse> patchSport(
            @PathVariable Long athleticSportId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchAthleticSportRequest request
    ) {
        return ResponseEntity.ok(
                athleticSportService.patchSport(athleticSportId, request, jwt == null ? null : jwt.getUserId())
        );
    }
}
