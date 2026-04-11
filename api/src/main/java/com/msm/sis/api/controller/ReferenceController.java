package com.msm.sis.api.controller;

import com.msm.sis.api.dto.CatalogAdvancedSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.CatalogSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.StudentReferenceOptionsResponse;
import com.msm.sis.api.service.ReferenceDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reference")
@Tag(name = "Reference Data", description = "Reference data endpoints")
public class ReferenceController {

    private final ReferenceDataService referenceDataService;

    public ReferenceController(ReferenceDataService referenceDataService) {
        this.referenceDataService = referenceDataService;
    }

    @GetMapping("/student-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get student reference options", description = "Returns reference options used by student detail forms")
    public ResponseEntity<StudentReferenceOptionsResponse> getStudentReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getStudentReferenceOptions());
    }

    @GetMapping("/catalog-search-options")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get catalog search reference options", description = "Returns academic years, terms, departments, subjects, and status options used by catalog search filters")
    public ResponseEntity<CatalogSearchReferenceOptionsResponse> getCatalogSearchReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getCatalogSearchReferenceOptions());
    }

    @GetMapping("/catalog-advanced-search-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get catalog search reference options", description = "Returns academic years, terms, departments, subjects, and status options used by catalog search filters")
    public ResponseEntity<CatalogAdvancedSearchReferenceOptionsResponse> getCatalogAdvancedSearchReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getCatalogAdvanceSearchReferenceOptions());
    }
}
