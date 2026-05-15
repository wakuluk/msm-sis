package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.transfer.CloseTransferCreditPolicyRequest;
import com.msm.sis.api.dto.transfer.TransferCreditPolicyListResponse;
import com.msm.sis.api.dto.transfer.TransferCreditPolicyResponse;
import com.msm.sis.api.dto.transfer.UpsertTransferCreditPolicyRequest;
import com.msm.sis.api.service.transfer.TransferCreditPolicyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/transfer-credit-policies")
@Tag(name = "transfer-credit-policy", description = "Manage global transfer credit policy")
public class TransferCreditPolicyController {

    private final TransferCreditPolicyService transferCreditPolicyService;

    public TransferCreditPolicyController(TransferCreditPolicyService transferCreditPolicyService) {
        this.transferCreditPolicyService = transferCreditPolicyService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List transfer credit policies",
            description = "Returns global transfer credit policy versions ordered by effective start date."
    )
    public ResponseEntity<TransferCreditPolicyListResponse> listPolicies(
            @AuthenticationPrincipal AuthenticatedJwt jwt
    ) {
        return ResponseEntity.ok(transferCreditPolicyService.listPolicies());
    }

    @GetMapping("/effective")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get effective transfer credit policy",
            description = "Returns the policy that applies to the supplied request date, or today when omitted."
    )
    public ResponseEntity<TransferCreditPolicyResponse> getEffectivePolicy(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate requestDate
    ) {
        return ResponseEntity.ok(transferCreditPolicyService.getEffectivePolicy(requestDate));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create transfer credit policy",
            description = "Creates a date-effective global transfer credit policy."
    )
    public ResponseEntity<TransferCreditPolicyResponse> createPolicy(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody UpsertTransferCreditPolicyRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transferCreditPolicyService.createPolicy(request));
    }

    @PatchMapping("/current")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update current open-ended transfer credit policy",
            description = "Updates the open-ended policy currently receiving new requests."
    )
    public ResponseEntity<TransferCreditPolicyResponse> updateCurrentOpenEndedPolicy(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody UpsertTransferCreditPolicyRequest request
    ) {
        return ResponseEntity.ok(transferCreditPolicyService.updateCurrentOpenEndedPolicy(request));
    }

    @PatchMapping("/current/close")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Close current open-ended transfer credit policy",
            description = "Sets an effective end date on the current open-ended policy."
    )
    public ResponseEntity<TransferCreditPolicyResponse> closeCurrentOpenEndedPolicy(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CloseTransferCreditPolicyRequest request
    ) {
        return ResponseEntity.ok(transferCreditPolicyService.closeCurrentOpenEndedPolicy(request));
    }

    @PatchMapping("/{policyId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update transfer credit policy",
            description = "Updates a date-effective global transfer credit policy."
    )
    public ResponseEntity<TransferCreditPolicyResponse> updatePolicy(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long policyId,
            @Valid @NotNull @RequestBody UpsertTransferCreditPolicyRequest request
    ) {
        return ResponseEntity.ok(transferCreditPolicyService.updatePolicy(policyId, request));
    }
}
