package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.billing.BillingPeriodDetailResponse;
import com.msm.sis.api.dto.billing.BillingPeriodRunResponse;
import com.msm.sis.api.dto.billing.BillingPeriodSearchResponse;
import com.msm.sis.api.dto.billing.CreateBillingPeriodRequest;
import com.msm.sis.api.dto.billing.CreateTuitionCodeRequest;
import com.msm.sis.api.dto.billing.PatchBillingPeriodRequest;
import com.msm.sis.api.dto.billing.PatchTuitionCodeRequest;
import com.msm.sis.api.dto.billing.RunBillingPeriodRequest;
import com.msm.sis.api.dto.billing.RunBillingPeriodResponse;
import com.msm.sis.api.dto.billing.TuitionCodeDetailResponse;
import com.msm.sis.api.dto.billing.TuitionCodeSearchResponse;
import com.msm.sis.api.service.billing.BillingPeriodService;
import com.msm.sis.api.service.billing.BillingService;
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

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@Tag(name = "billing", description = "Manage billing reference data")
public class BillingController {

    private final BillingService billingService;
    private final BillingPeriodService billingPeriodService;

    public BillingController(
            BillingService billingService,
            BillingPeriodService billingPeriodService
    ) {
        this.billingService = billingService;
        this.billingPeriodService = billingPeriodService;
    }

    @GetMapping("/periods")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search billing periods", description = "Returns paged billing period search results")
    public ResponseEntity<BillingPeriodSearchResponse> searchBillingPeriods(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String academicTerm,
            @RequestParam(required = false) String financialAidPeriod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(
                billingPeriodService.searchBillingPeriods(
                        name,
                        description,
                        status,
                        academicTerm,
                        financialAidPeriod,
                        page,
                        size,
                        sortBy,
                        sortDirection
                )
        );
    }

    @PostMapping("/periods")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create billing period", description = "Creates a billing period setup record")
    public ResponseEntity<BillingPeriodDetailResponse> createBillingPeriod(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CreateBillingPeriodRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                billingPeriodService.createBillingPeriod(request, jwt == null ? null : jwt.getUserId())
        );
    }

    @GetMapping("/periods/{billingPeriodId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get billing period detail", description = "Returns billing period detail")
    public ResponseEntity<BillingPeriodDetailResponse> getBillingPeriodDetail(
            @PathVariable Long billingPeriodId
    ) {
        return ResponseEntity.ok(billingPeriodService.getBillingPeriodDetail(billingPeriodId));
    }

    @PatchMapping("/periods/{billingPeriodId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch billing period", description = "Updates a billing period setup record")
    public ResponseEntity<BillingPeriodDetailResponse> patchBillingPeriod(
            @PathVariable Long billingPeriodId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchBillingPeriodRequest request
    ) {
        return ResponseEntity.ok(
                billingPeriodService.updateBillingPeriod(
                        billingPeriodId,
                        request,
                        jwt == null ? null : jwt.getUserId()
                )
        );
    }

    @GetMapping("/periods/{billingPeriodId}/runs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List billing period runs", description = "Returns billing run history for a billing period")
    public ResponseEntity<List<BillingPeriodRunResponse>> listBillingPeriodRuns(
            @PathVariable Long billingPeriodId
    ) {
        return ResponseEntity.ok(billingPeriodService.listBillingPeriodRuns(billingPeriodId));
    }

    @PostMapping("/periods/{billingPeriodId}/runs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Run billing period", description = "Creates a queued billing run row for now")
    public ResponseEntity<RunBillingPeriodResponse> runBillingPeriod(
            @PathVariable Long billingPeriodId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @RequestBody(required = false) RunBillingPeriodRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                billingPeriodService.createStubbedBillingRun(
                        billingPeriodId,
                        request,
                        jwt == null ? null : jwt.getUserId()
                )
        );
    }

    @GetMapping("/tuition-codes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search tuition codes", description = "Returns paged tuition code search results")
    public ResponseEntity<TuitionCodeSearchResponse> searchTuitionCodes(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "code") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(
                billingService.searchTuitionCodes(code, name, page, size, sortBy, sortDirection)
        );
    }

    @PostMapping("/tuition-codes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create tuition code", description = "Creates a tuition code reference option")
    public ResponseEntity<TuitionCodeDetailResponse> createTuitionCode(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CreateTuitionCodeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                billingService.createTuitionCode(request, jwt == null ? null : jwt.getUserId())
        );
    }

    @GetMapping("/tuition-codes/{tuitionCodeId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get tuition code detail", description = "Returns tuition code detail")
    public ResponseEntity<TuitionCodeDetailResponse> getTuitionCodeDetail(
            @PathVariable Long tuitionCodeId
    ) {
        return ResponseEntity.ok(billingService.getTuitionCodeDetail(tuitionCodeId));
    }

    @PatchMapping("/tuition-codes/{tuitionCodeId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch tuition code", description = "Updates a tuition code reference option")
    public ResponseEntity<TuitionCodeDetailResponse> patchTuitionCode(
            @PathVariable Long tuitionCodeId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody PatchTuitionCodeRequest request
    ) {
        return ResponseEntity.ok(
                billingService.updateTuitionCode(tuitionCodeId, request, jwt == null ? null : jwt.getUserId())
        );
    }
}
