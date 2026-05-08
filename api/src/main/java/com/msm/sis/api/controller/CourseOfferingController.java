package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.course.*;
import com.msm.sis.api.service.course.CourseOfferingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/course-offerings")
@Tag(name = "Course Offerings", description = "Catalog course offering endpoints")
public class CourseOfferingController {

    private final CourseOfferingService courseOfferingService;

    public CourseOfferingController(CourseOfferingService courseOfferingService) {
        this.courseOfferingService = courseOfferingService;
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Search course offerings",
            description = "Returns paged course offering search results from the catalog. Example: /api/course-offerings?subTermCode=FALL-2026&subjectCode=TOLK&title=Tolkien&page=0&size=25&sortBy=courseNumber&sortDirection=asc"
    )
    public ResponseEntity<CourseOfferingSearchResponse> searchPublicCourseOfferings(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute CourseOfferingSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "subTermCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(courseOfferingService.searchPublicCourseOfferings(
                criteria,
                page,
                size,
                parseCourseOfferingSearchSortField(sortBy),
                parseSortDirection(sortDirection)
        ));
    }

    @GetMapping("/advanced-search")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(
            summary = "Search course offerings",
            description = "Returns paged course offering search results from the catalog. Example: /api/course-offerings?subTermCode=FALL-2026&subjectCode=TOLK&title=Tolkien&page=0&size=25&sortBy=courseNumber&sortDirection=asc"
    )
    public ResponseEntity<CourseOfferingSearchResponse> searchCourseOfferings(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute CourseOfferingAdvancedSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "subTermCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(courseOfferingService.searchCourseOfferings(
                criteria,
                page,
                size,
                parseCourseOfferingSearchSortField(sortBy),
                parseSortDirection(sortDirection)
        ));
    }

    @GetMapping("/details/{courseOfferingId}")
    @PreAuthorize("hasAnyRole('STUDENT')")
    @Operation(summary = "Get course offering by id", description = "Returns the row-expansion details for a single course offering.")
    public ResponseEntity<CourseOfferingDetailResponse> getCourseOfferingDetails(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long courseOfferingId
    ) {
        return ResponseEntity.ok(courseOfferingService.getPublicCourseOfferingById(courseOfferingId));
    }

    @GetMapping("/details-advanced/{courseOfferingId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get course offering by id", description = "Returns the row-expansion details for a single course offering.")
    public ResponseEntity<CourseOfferingDetailResponse> getCourseOfferingAdvancedDetails(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long courseOfferingId
    ) {
        return ResponseEntity.ok(courseOfferingService.getCourseOfferingById(courseOfferingId));
    }

    @PatchMapping("/{courseOfferingId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Patch course offering",
            description = "Updates an admin course offering's assigned sub terms, offering status, and notes."
    )
    public ResponseEntity<CourseOfferingDetailResponse> patchCourseOffering(
            @PathVariable Long courseOfferingId,
            @Valid @NotNull @RequestBody PatchCourseOfferingRequest request
    ) {
        return ResponseEntity.ok(courseOfferingService.patchCourseOffering(courseOfferingId, request));
    }

    private CourseOfferingSearchSortField parseCourseOfferingSearchSortField(String sortBy) {
        try {
            return CourseOfferingSearchSortField.fromRequestValue(sortBy);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage());
        }
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        try {
            return Sort.Direction.fromString(sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Sort direction must be 'asc' or 'desc'.");
        }
    }
}
