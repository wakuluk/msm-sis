package com.msm.sis.api.controller;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermRequest;
import com.msm.sis.api.service.academic.AcademicTermService;
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
@RequestMapping("/api/academic-terms")
@Tag(name = "academic-term", description = "Manage Academic Terms")
public class AcademicTermController {

    private final AcademicTermService academicTermService;

    public AcademicTermController(AcademicTermService academicTermService) {
        this.academicTermService = academicTermService;
    }

    @GetMapping("/{termId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic term", description = "Gets a single academic term by ID")
    public ResponseEntity<AcademicTermResponse> getAcademicTerm(@PathVariable("termId") Long termId) {
        return ResponseEntity.ok(academicTermService.getAcademicTerm(termId));
    }

    @PatchMapping("/{termId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch academic term", description = "Patches a single academic term by ID")
    public ResponseEntity<AcademicTermResponse> patchAcademicTerm(
            @PathVariable("termId") Long termId,
            @Valid @NotNull @RequestBody PatchAcademicTermRequest request
    ) {
        return ResponseEntity.ok(academicTermService.patchAcademicTerm(termId, request));
    }
}
