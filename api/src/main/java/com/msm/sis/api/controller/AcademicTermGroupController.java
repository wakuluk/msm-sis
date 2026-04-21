package com.msm.sis.api.controller;

import com.msm.sis.api.dto.academic.term.AcademicTermGroupResponse;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermGroupRequest;
import com.msm.sis.api.service.academic.AcademicTermGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/academic-term-group")
@Tag(name = "academic-term-group", description = "Manage Academic Term Groups")
public class AcademicTermGroupController {

    private final AcademicTermGroupService academicTermGroupService;

    public AcademicTermGroupController(AcademicTermGroupService academicTermGroupService) {
        this.academicTermGroupService = academicTermGroupService;
    }

    @GetMapping("/{termGroupId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic term group", description = "Gets a single academic term group by ID")
    public ResponseEntity<AcademicTermGroupResponse> getAcademicTermGroup(@PathVariable Long termGroupId) {
        return ResponseEntity.ok(academicTermGroupService.getAcademicTermGroup(termGroupId));
    }

    @PatchMapping("/{termGroupId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch academic term group", description = "Patches a single academic term group by ID")
    public ResponseEntity<AcademicTermGroupResponse> patchAcademicTermGroup(
            @PathVariable Long termGroupId,
            @Valid @NotNull @RequestBody PatchAcademicTermGroupRequest request
    ) {
        return ResponseEntity.ok(academicTermGroupService.patchAcademicTermGroup(termGroupId, request));
    }
}
