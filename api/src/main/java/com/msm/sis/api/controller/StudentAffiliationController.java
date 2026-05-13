package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.student.affiliation.AddStudentAthleteRequest;
import com.msm.sis.api.dto.student.affiliation.PatchStudentAthleteRequest;
import com.msm.sis.api.dto.student.affiliation.StudentAffiliationSummaryResponse;
import com.msm.sis.api.dto.student.affiliation.UpdateStudentHonorsRequest;
import com.msm.sis.api.service.student.StudentAffiliationService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students/{studentId}/affiliations")
@Tag(name = "student-affiliations", description = "Manage student honors and athletics affiliations")
public class StudentAffiliationController {

    private final StudentAffiliationService studentAffiliationService;

    public StudentAffiliationController(StudentAffiliationService studentAffiliationService) {
        this.studentAffiliationService = studentAffiliationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    @Operation(summary = "Get student affiliations", description = "Returns honors and athletics status for a student")
    public ResponseEntity<StudentAffiliationSummaryResponse> getStudentAffiliations(
            @PathVariable Long studentId,
            @AuthenticationPrincipal AuthenticatedJwt jwt
    ) {
        return ResponseEntity.ok(studentAffiliationService.getStudentAffiliations(studentId, jwt));
    }

    @PutMapping("/honors")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update student honors status", description = "Creates or replaces the honors status for a student")
    public ResponseEntity<StudentAffiliationSummaryResponse> updateHonors(
            @PathVariable Long studentId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody UpdateStudentHonorsRequest request
    ) {
        return ResponseEntity.ok(
                studentAffiliationService.updateHonors(studentId, request, jwt == null ? null : jwt.getUserId())
        );
    }

    @PostMapping("/athletes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add student athlete status", description = "Adds or reactivates an athletics status for a student")
    public ResponseEntity<StudentAffiliationSummaryResponse> addAthlete(
            @PathVariable Long studentId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody AddStudentAthleteRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                studentAffiliationService.addAthlete(studentId, request, jwt == null ? null : jwt.getUserId())
        );
    }

    @PatchMapping("/athletes/{studentAthleteId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch student athlete status", description = "Updates an athletics status for a student")
    public ResponseEntity<StudentAffiliationSummaryResponse> patchAthlete(
            @PathVariable Long studentId,
            @PathVariable Long studentAthleteId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchStudentAthleteRequest request
    ) {
        return ResponseEntity.ok(
                studentAffiliationService.patchAthlete(
                        studentId,
                        studentAthleteId,
                        request,
                        jwt == null ? null : jwt.getUserId()
                )
        );
    }
}
