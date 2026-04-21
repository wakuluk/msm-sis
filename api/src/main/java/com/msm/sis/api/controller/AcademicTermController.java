package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.AcademicTermStatusResponse;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermRequest;
import com.msm.sis.api.dto.academic.term.ShiftAcademicTermStatusRequest;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.service.academic.AcademicTermService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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

import java.util.List;

@RestController
@RequestMapping("/api/academic-term")
@Tag(name = "academic-term", description = "Manage Academic Terms")
public class AcademicTermController {

    private final AcademicTermService academicTermService;

    public AcademicTermController(AcademicTermService academicTermService) {
        this.academicTermService = academicTermService;
    }

    @GetMapping("/{termId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic term", description = "Gets a single academic term by ID")
    public ResponseEntity<AcademicTermResponse> getAcademicTerm(@PathVariable Long termId) {
        return ResponseEntity.ok(academicTermService.getAcademicTerm(termId));
    }

    @PatchMapping("/{termId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch academic term", description = "Patches a single academic term by ID")
    public ResponseEntity<AcademicTermResponse> patchAcademicTerm(
            @PathVariable Long termId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchAcademicTermRequest request
    ) {
        return ResponseEntity.ok(
                academicTermService.patchAcademicTerm(termId, request, jwt.getEmail())
        );
    }

    @GetMapping("/{termId}/course-offerings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get academic term course offerings",
            description = "Returns all course offerings associated with a single academic term."
    )
    public ResponseEntity<List<CourseOfferingSearchResultResponse>> getAcademicTermCourseOfferings(
            @PathVariable Long termId,
            @RequestParam(defaultValue = "courseCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(
                academicTermService.getCourseOfferingsForAcademicTerm(termId, sortBy, sortDirection)
        );
    }

    @PostMapping("/{termId}/status/shift")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Shift academic term status",
            description = "Moves an academic term status up or down one linear workflow step."
    )
    public ResponseEntity<AcademicTermResponse> shiftAcademicTermStatus(
            @PathVariable Long termId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody ShiftAcademicTermStatusRequest request
    ) {
        return ResponseEntity.ok(
                academicTermService.shiftAcademicTermStatus(
                        termId,
                        request.direction(),
                        jwt.getEmail()
                )
        );
    }

    @GetMapping("/statuses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic term statuses", description = "Returns all academic term statuses ordered by sort order")
    public ResponseEntity<List<AcademicTermStatusResponse>> getAcademicTermStatuses() {
        return ResponseEntity.ok(academicTermService.getAcademicTermStatuses());
    }
}
