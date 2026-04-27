package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.course.CourseSectionDetailResponse;
import com.msm.sis.api.dto.course.CourseSectionListResponse;
import com.msm.sis.api.dto.course.CreateCourseSectionRequest;
import com.msm.sis.api.dto.course.PatchCourseSectionRequest;
import com.msm.sis.api.service.course.CourseSectionPatchService;
import com.msm.sis.api.service.course.CourseSectionService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Course Sections", description = "Manage course sections")
public class CourseSectionController {
    private final CourseSectionPatchService courseSectionPatchService;
    private final CourseSectionService courseSectionService;

    public CourseSectionController(
            CourseSectionPatchService courseSectionPatchService,
            CourseSectionService courseSectionService
    ) {
        this.courseSectionPatchService = courseSectionPatchService;
        this.courseSectionService = courseSectionService;
    }

    @GetMapping("/course-offerings/{courseOfferingId}/sections")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List course sections for a course offering",
            description = "Returns paged course sections for a course offering, optionally scoped to an academic sub term."
    )
    public ResponseEntity<CourseSectionListResponse> getCourseSectionsForOffering(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long courseOfferingId,
            @RequestParam(required = false) Long subTermId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "sectionLetter") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(courseSectionService.getCourseSectionsForOffering(
                courseOfferingId,
                subTermId,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }

    @PostMapping("/course-offerings/{courseOfferingId}/sections")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create course section",
            description = "Creates a course section for a course offering and academic sub term."
    )
    public ResponseEntity<CourseSectionDetailResponse> createCourseSection(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long courseOfferingId,
            @Valid @NotNull @RequestBody CreateCourseSectionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseSectionService.createCourseSection(courseOfferingId, request));
    }

    @GetMapping("/course-sections/{sectionId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get course section detail",
            description = "Returns the detail view for a single course section."
    )
    public ResponseEntity<CourseSectionDetailResponse> getCourseSectionDetail(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long sectionId
    ) {
        return ResponseEntity.ok(courseSectionService.getCourseSectionDetail(sectionId));
    }

    @PatchMapping("/course-sections/{sectionId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Patch course section",
            description = "Partially updates a course section. Included instructor or meeting lists replace existing rows."
    )
    public ResponseEntity<CourseSectionDetailResponse> patchCourseSection(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long sectionId,
            @Valid @NotNull @RequestBody PatchCourseSectionRequest request
    ) {
        return ResponseEntity.ok(courseSectionPatchService.patchCourseSection(sectionId, request));
    }
}
