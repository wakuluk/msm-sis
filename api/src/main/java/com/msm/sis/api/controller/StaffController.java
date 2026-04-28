package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.staff.StaffSearchResponse;
import com.msm.sis.api.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff")
@Tag(name = "Staff", description = "Search staff records")
@RequiredArgsConstructor
public class StaffController {
    private final StaffService staffService;

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search staff",
            description = "Returns paged staff options for autocomplete-style staff assignment controls."
    )
    public ResponseEntity<StaffSearchResponse> searchStaff(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(staffService.searchStaff(search, page, size));
    }
}
