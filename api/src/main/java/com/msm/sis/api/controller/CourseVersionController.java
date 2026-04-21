package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.course.CourseVersionDetailResponse;
import com.msm.sis.api.service.course.CourseVersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/course-versions")
@Tag(name = "course-version", description = "Manage Course Versions")
public class CourseVersionController {

    private final CourseVersionService courseVersionService;

    public CourseVersionController(CourseVersionService courseVersionService) {
        this.courseVersionService = courseVersionService;
    }

    @PostMapping("/{courseVersionId}/make-current")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Make course version current",
            description = "Marks the selected course version as current and demotes the other versions for the same course."
    )
    public ResponseEntity<CourseVersionDetailResponse> makeVersionCurrent(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long courseVersionId
    ) {
        return ResponseEntity.ok(courseVersionService.makeVersionCurrent(courseVersionId));
    }
}
