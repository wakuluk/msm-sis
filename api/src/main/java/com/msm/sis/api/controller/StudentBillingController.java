package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.billing.StudentBillingAssignmentResponse;
import com.msm.sis.api.dto.billing.UpdateStudentBillingAssignmentRequest;
import com.msm.sis.api.service.billing.BillingService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@Tag(name = "student-billing", description = "Manage student billing assignments")
public class StudentBillingController {

    private final BillingService billingService;

    public StudentBillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/{studentId}/billing")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get student billing", description = "Returns a student's billing assignment")
    public ResponseEntity<StudentBillingAssignmentResponse> getStudentBillingAssignment(
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(billingService.getStudentBillingAssignment(studentId));
    }

    @PatchMapping("/{studentId}/billing/tuition-code")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch student tuition code", description = "Assigns or clears a student's tuition code")
    public ResponseEntity<StudentBillingAssignmentResponse> patchStudentTuitionCodeAssignment(
            @PathVariable Long studentId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody UpdateStudentBillingAssignmentRequest request
    ) {
        return ResponseEntity.ok(
                billingService.updateStudentBillingAssignment(studentId, request, jwt == null ? null : jwt.getUserId())
        );
    }
}
