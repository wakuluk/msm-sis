package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.academic.term.AcademicSubTermResponse;
import com.msm.sis.api.dto.academic.term.AcademicSubTermStatusResponse;
import com.msm.sis.api.dto.academic.term.PatchAcademicSubTermRequest;
import com.msm.sis.api.dto.academic.term.ShiftAcademicSubTermStatusRequest;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.service.academic.AcademicSubTermService;
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
@RequestMapping("/api/academic-sub-term")
@Tag(name = "academic-sub-term", description = "Manage Academic Sub Terms")
public class AcademicSubTermController {

    private final AcademicSubTermService academicSubTermService;

    public AcademicSubTermController(AcademicSubTermService academicSubTermService) {
        this.academicSubTermService = academicSubTermService;
    }

    @GetMapping("/{subTermId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic sub term", description = "Gets a single academic sub term by ID")
    public ResponseEntity<AcademicSubTermResponse> getAcademicSubTerm(
            @PathVariable("subTermId") Long subTermId
    ) {
        return ResponseEntity.ok(academicSubTermService.getAcademicSubTerm(subTermId));
    }

    @PatchMapping("/{subTermId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch academic sub term", description = "Patches a single academic sub term by ID")
    public ResponseEntity<AcademicSubTermResponse> patchAcademicSubTerm(
            @PathVariable("subTermId") Long subTermId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchAcademicSubTermRequest request
    ) {
        return ResponseEntity.ok(
                academicSubTermService.patchAcademicSubTerm(subTermId, request, jwt.getEmail())
        );
    }

    @GetMapping("/{subTermId}/course-offerings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get academic sub term course offerings",
            description = "Returns all course offerings associated with a single academic sub term."
    )
    public ResponseEntity<List<CourseOfferingSearchResultResponse>> getAcademicSubTermCourseOfferings(
            @PathVariable("subTermId") Long subTermId,
            @RequestParam(defaultValue = "courseCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(
                academicSubTermService.getCourseOfferingsForAcademicSubTerm(
                        subTermId,
                        sortBy,
                        sortDirection
                )
        );
    }

    @PostMapping("/{subTermId}/status/shift")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Shift academic sub term status",
            description = "Moves an academic sub term status up or down one linear workflow step."
    )
    public ResponseEntity<AcademicSubTermResponse> shiftAcademicSubTermStatus(
            @PathVariable("subTermId") Long subTermId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody ShiftAcademicSubTermStatusRequest request
    ) {
        return ResponseEntity.ok(
                academicSubTermService.shiftAcademicSubTermStatus(
                        subTermId,
                        request.direction(),
                        jwt.getEmail()
                )
        );
    }

    @GetMapping("/statuses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic sub term statuses", description = "Returns all academic sub term statuses ordered by sort order")
    public ResponseEntity<List<AcademicSubTermStatusResponse>> getAcademicSubTermStatuses() {
        return ResponseEntity.ok(academicSubTermService.getAcademicSubTermStatuses());
    }
}
