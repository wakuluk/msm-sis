package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.program.CreateProgramRequest;
import com.msm.sis.api.dto.program.CreateProgramResponse;
import com.msm.sis.api.dto.program.ProgramDetailResponse;
import com.msm.sis.api.dto.program.ProgramSearchCriteria;
import com.msm.sis.api.dto.program.ProgramSearchResponse;
import com.msm.sis.api.service.program.ProgramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/programs")
@Tag(name = "program", description = "Manage Programs")
public class ProgramController {

    private final ProgramService programService;

    public ProgramController(ProgramService programService) {
        this.programService = programService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create program",
            description = "Creates a program and its initial version."
    )
    public ResponseEntity<CreateProgramResponse> createProgram(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CreateProgramRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(programService.createProgram(request));
    }

    @GetMapping("/{programId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get program detail",
            description = "Returns a program, its versions, and version requirements."
    )
    public ResponseEntity<ProgramDetailResponse> getProgramDetail(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long programId
    ) {
        return ResponseEntity.ok(programService.getProgramDetail(programId));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search programs",
            description = "Returns paged program search results."
    )
    public ResponseEntity<ProgramSearchResponse> searchPrograms(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute ProgramSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "code") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(programService.searchPrograms(
                criteria,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }
}
