package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.program.AttachProgramVersionRequirementRequest;
import com.msm.sis.api.dto.program.CreateRequirementRequest;
import com.msm.sis.api.dto.program.PatchProgramVersionRequirementRequest;
import com.msm.sis.api.dto.program.PatchRequirementRequest;
import com.msm.sis.api.dto.program.ProgramVersionRequirementResponse;
import com.msm.sis.api.dto.program.RequirementDetailResponse;
import com.msm.sis.api.dto.program.RequirementSearchCriteria;
import com.msm.sis.api.dto.program.RequirementSearchResponse;
import com.msm.sis.api.dto.program.RequirementSearchResultResponse;
import com.msm.sis.api.service.program.RequirementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "requirement", description = "Manage reusable program requirements")
public class RequirementController {

    private final RequirementService requirementService;

    public RequirementController(RequirementService requirementService) {
        this.requirementService = requirementService;
    }

    @GetMapping("/requirements/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search requirements",
            description = "Returns paged reusable requirement search results."
    )
    public ResponseEntity<RequirementSearchResponse> searchRequirements(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute RequirementSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(requirementService.searchRequirements(criteria, page, size));
    }

    @GetMapping("/requirements/{requirementId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get requirement detail",
            description = "Returns a reusable requirement and its course/rule details."
    )
    public ResponseEntity<RequirementDetailResponse> getRequirementDetail(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long requirementId
    ) {
        return ResponseEntity.ok(requirementService.getRequirementDetail(requirementId));
    }

    @PostMapping("/requirements")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create requirement",
            description = "Creates a reusable program requirement."
    )
    public ResponseEntity<RequirementSearchResultResponse> createRequirement(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CreateRequirementRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requirementService.createRequirement(request));
    }

    @PatchMapping("/requirements/{requirementId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Patch requirement",
            description = "Updates a reusable program requirement."
    )
    public ResponseEntity<RequirementSearchResultResponse> patchRequirement(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long requirementId,
            @Valid @NotNull @RequestBody PatchRequirementRequest request
    ) {
        return ResponseEntity.ok(requirementService.patchRequirement(requirementId, request));
    }

    @PostMapping("/program-versions/{programVersionId}/requirements")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Attach requirement to program version",
            description = "Attaches a reusable requirement to a program version."
    )
    public ResponseEntity<ProgramVersionRequirementResponse> attachRequirementToProgramVersion(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long programVersionId,
            @Valid @NotNull @RequestBody AttachProgramVersionRequirementRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requirementService.attachRequirementToProgramVersion(programVersionId, request));
    }

    @PatchMapping("/program-version-requirements/{programVersionRequirementId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Patch program version requirement",
            description = "Updates requirement assignment details for a program version."
    )
    public ResponseEntity<ProgramVersionRequirementResponse> patchProgramVersionRequirement(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long programVersionRequirementId,
            @Valid @NotNull @RequestBody PatchProgramVersionRequirementRequest request
    ) {
        return ResponseEntity.ok(
                requirementService.patchProgramVersionRequirement(programVersionRequirementId, request)
        );
    }

    @DeleteMapping("/program-version-requirements/{programVersionRequirementId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Remove program version requirement",
            description = "Removes a requirement assignment from a program version."
    )
    public ResponseEntity<Void> removeProgramVersionRequirement(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long programVersionRequirementId
    ) {
        requirementService.removeProgramVersionRequirement(programVersionRequirementId);
        return ResponseEntity.noContent().build();
    }
}
