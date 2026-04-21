package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.course.*;
import com.msm.sis.api.service.course.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@Tag(name = "course", description = "Manage Courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/{courseId}/versions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search course versions by course id", description = "Returns paged version details for a course.")
    public ResponseEntity<CourseVersionSearchResponse> getCourseVersionsForCourseId(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "versionNumber") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(courseService.getCourseVersionsForCourseId(
                courseId,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search courses",
            description = "Returns paged course search results."
    )
    public ResponseEntity<CourseSearchResponse> searchCourses(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute CourseSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "courseNumber") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(courseService.searchCourses(
                criteria,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }

    @PostMapping("/{courseId}/versions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create course version", description = "Creates a new course version for a course.")
    public ResponseEntity<CourseVersionDetailResponse> createCourseVersion(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long courseId,
            @Valid @NotNull @RequestBody CreateCourseVersionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.createCourseVersion(courseId, request));
    }
}
