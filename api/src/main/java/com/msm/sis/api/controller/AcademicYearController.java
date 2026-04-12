package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.academic.year.*;
import com.msm.sis.api.service.academic.AcademicYearService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academic-year")
@Tag(name = "academic-year", description = "Manage Academic Year")
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    public AcademicYearController(AcademicYearService academicYearService) {
        this.academicYearService = academicYearService;
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create academic year", description = "Creates a new academic year with optional academic terms")
    public ResponseEntity<AcademicYearResponse> createAcademicYear(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CreateAcademicYearRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicYearService.createAcademicYear(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search academic years", description = "Searches academic years using optional query, active, currentOnly, sort, and pagination criteria")
    public ResponseEntity<List<AcademicYearSearchResponse>> searchAcademicYears(
            @ModelAttribute AcademicYearSearchCriteria request
    ) {
        return ResponseEntity.ok(academicYearService.searchAcademicYears(request));
    }

    @GetMapping("/{academicYearId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic year", description = "Gets a single academic year and its academic terms by ID")
    public ResponseEntity<AcademicYearResponse> getAcademicYear(
            @PathVariable Long academicYearId
    ) {
        return ResponseEntity.ok(academicYearService.getAcademicYear(academicYearId));
    }

    @PatchMapping("/{academicYearId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patches an academic year", description = "Patches a single academic year and its academic terms")
    public ResponseEntity<AcademicYearResponse> patchAcademicYear(
            @PathVariable Long academicYearId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchAcademicYearRequest request)
    {
        return ResponseEntity.ok(academicYearService.patchAcademicYear(academicYearId, request, jwt.getEmail()));
    }

}
