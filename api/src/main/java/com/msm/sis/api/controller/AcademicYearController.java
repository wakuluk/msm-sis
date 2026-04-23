package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.*;
import com.msm.sis.api.dto.catalog.AcademicYearCatalogResponse;
import com.msm.sis.api.dto.catalog.AcademicYearCatalogSummaryResponse;
import com.msm.sis.api.dto.course.AcademicYearCourseOfferingSearchCriteria;
import com.msm.sis.api.dto.course.AcademicYearCourseOfferingSearchResponse;
import com.msm.sis.api.dto.course.CourseOfferingDetailResponse;
import com.msm.sis.api.dto.course.CreateCourseOfferingRequest;
import com.msm.sis.api.dto.course.ImportAcademicYearCourseOfferingsResponse;
import com.msm.sis.api.dto.course.SyncAcademicYearCourseOfferingsResponse;
import com.msm.sis.api.service.academic.AcademicYearService;
import com.msm.sis.api.service.course.CourseOfferingService;
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
    private final CourseOfferingService courseOfferingService;

    public AcademicYearController(
            AcademicYearService academicYearService,
            CourseOfferingService courseOfferingService
    ) {
        this.academicYearService = academicYearService;
        this.courseOfferingService = courseOfferingService;
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create academic year", description = "Creates a new academic year with optional academic sub terms")
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
    @Operation(summary = "Get academic year", description = "Gets a single academic year and its terms and sub terms by ID")
    public ResponseEntity<AcademicYearResponse> getAcademicYear(
            @PathVariable Long academicYearId
    ) {
        return ResponseEntity.ok(academicYearService.getAcademicYear(academicYearId));
    }

    @PatchMapping("/{academicYearId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patches an academic year", description = "Patches a single academic year")
    public ResponseEntity<AcademicYearResponse> patchAcademicYear(
            @PathVariable Long academicYearId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchAcademicYearRequest request)
    {
        return ResponseEntity.ok(academicYearService.patchAcademicYear(academicYearId, request, jwt.getEmail()));
    }

    @PostMapping("/{academicYearId}/status/shift")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Shift academic year status",
            description = "Moves an academic year status up or down one linear workflow step."
    )
    public ResponseEntity<AcademicYearResponse> shiftAcademicYearStatus(
            @PathVariable Long academicYearId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody ShiftAcademicYearStatusRequest request
    ) {
        return ResponseEntity.ok(
                academicYearService.shiftAcademicYearStatus(
                        academicYearId,
                        request.direction(),
                        jwt.getEmail()
                )
        );
    }

    @GetMapping("/{academicYearId}/catalog/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicYearCatalogSummaryResponse> getAcademicYearCatalogSummary(
            @PathVariable Long academicYearId,
            @AuthenticationPrincipal AuthenticatedJwt jwt)
    {
        return ResponseEntity.ok(academicYearService.getCatalogSummary(academicYearId));
    }

    @GetMapping("/{academicYearId}/catalog")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get academic year catalog",
            description = "Returns the academic year catalog grouped by terms and sub terms, with course offerings under each sub term."
    )
    public ResponseEntity<AcademicYearCatalogResponse> getAcademicYearCatalog(
            @PathVariable Long academicYearId
    ) {
        return ResponseEntity.ok(academicYearService.getCatalog(academicYearId));
    }

    @PostMapping("/{academicYearId}/course-offerings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create academic year course offering",
            description = "Creates a year-scoped course offering and assigns it to one or more academic sub terms within the academic year."
    )
    public ResponseEntity<CourseOfferingDetailResponse> postAcademicYearCourseOffering(
            @PathVariable Long academicYearId,
            @Valid @NotNull @RequestBody CreateCourseOfferingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseOfferingService.createCourseOffering(academicYearId, request));
    }

    @PostMapping("/{academicYearId}/course-offerings/import-current-course-versions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Import current course versions into academic year catalog",
            description = "Creates year-scoped course offerings for all current course versions whose courses are active and do not already have an offering in the academic year."
    )
    public ResponseEntity<ImportAcademicYearCourseOfferingsResponse> importCurrentCourseVersionsIntoAcademicYear(
            @PathVariable Long academicYearId
    ) {
        return ResponseEntity.ok(
                courseOfferingService.importCurrentCourseVersionsIntoAcademicYear(academicYearId)
        );
    }

    @PostMapping("/{academicYearId}/course-offerings/sync-current-course-versions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Sync academic year course offerings to current course versions",
            description = "Repoints stale academic year course offerings to their course's current version when possible and reports the number updated, already current, or skipped."
    )
    public ResponseEntity<SyncAcademicYearCourseOfferingsResponse> syncAcademicYearCourseOfferingsToCurrentCourseVersions(
            @PathVariable Long academicYearId
    ) {
        return ResponseEntity.ok(
                courseOfferingService.syncAcademicYearCourseOfferingsToCurrentCourseVersions(academicYearId)
        );
    }

    @GetMapping("/{academicYearId}/course-offerings/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search academic year course offerings",
            description = "Returns paged academic year course offerings filtered by school, department, subject, course code, and title."
    )
    public ResponseEntity<AcademicYearCourseOfferingSearchResponse> searchAcademicYearCourseOfferings(
            @PathVariable Long academicYearId,
            @ModelAttribute AcademicYearCourseOfferingSearchCriteria criteria
    ) {
        return ResponseEntity.ok(courseOfferingService.searchAcademicYearCourseOfferings(academicYearId, criteria));
    }

    @PostMapping("/{academicYearId}/sub-terms")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Adds a list of academic sub terms", description = "Adds a list of academic sub terms to an academic year")
    public ResponseEntity<AcademicYearResponse> postAcademicYearSubTerms(
            @PathVariable Long academicYearId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody List<CreateAcademicYearSubTermRequest> request)
    {
        return ResponseEntity.ok(
                academicYearService.postAcademicYearSubTerms(academicYearId, request, jwt.getEmail())
        );
    }

    @PostMapping("/{academicYearId}/terms")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create academic term", description = "Creates an academic term within an academic year")
    public ResponseEntity<AcademicTermResponse> postAcademicYearTerm(
            @PathVariable Long academicYearId,
            @Valid @NotNull @RequestBody CreateAcademicTermRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(academicYearService.postAcademicYearTerm(academicYearId, request));
    }

    @GetMapping("/{academicYearId}/terms")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic terms", description = "Gets academic terms for a single academic year")
    public ResponseEntity<List<AcademicTermResponse>> getAcademicYearTerms(
            @PathVariable Long academicYearId
    ) {
        return ResponseEntity.ok(academicYearService.getAcademicYearTerms(academicYearId));
    }

    @GetMapping("/statuses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic year statuses", description = "Returns all academic year statuses ordered by sort order")
    public ResponseEntity<List<AcademicYearStatusResponse>> getAcademicYearStatuses() {
        return ResponseEntity.ok(academicYearService.getAcademicYearStatuses());
    }
}
