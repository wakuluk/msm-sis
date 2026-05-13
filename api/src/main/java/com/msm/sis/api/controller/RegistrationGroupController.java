package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.registration.AddRegistrationGroupStudentRequest;
import com.msm.sis.api.dto.registration.BulkAssignRegistrationGroupStudentsRequest;
import com.msm.sis.api.dto.registration.BulkAssignRegistrationGroupStudentsResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupBuilderPreviewRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupBuilderPreviewResponse;
import com.msm.sis.api.dto.registration.PatchRegistrationGroupRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupDetailResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupEmailNotificationResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupGenerationCreateRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupGenerationCreateResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishResultResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishValidationResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupReferenceOptionsResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupSearchCriteria;
import com.msm.sis.api.dto.registration.RegistrationGroupSearchResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupStudentOptionsResponse;
import com.msm.sis.api.dto.registration.UnassignedRegistrationGroupStudentSearchCriteria;
import com.msm.sis.api.dto.registration.UnassignedRegistrationGroupStudentSearchResponse;
import com.msm.sis.api.service.registration.RegistrationGroupBuilderPreviewService;
import com.msm.sis.api.service.registration.RegistrationGroupDetailService;
import com.msm.sis.api.service.registration.RegistrationGroupGenerationSaveService;
import com.msm.sis.api.service.registration.RegistrationGroupNotificationService;
import com.msm.sis.api.service.registration.RegistrationGroupPatchService;
import com.msm.sis.api.service.registration.RegistrationGroupPublishService;
import com.msm.sis.api.service.registration.RegistrationGroupPublishValidationService;
import com.msm.sis.api.service.registration.RegistrationGroupReferenceDataService;
import com.msm.sis.api.service.registration.RegistrationGroupSearchService;
import com.msm.sis.api.service.registration.RegistrationGroupSinglePublishService;
import com.msm.sis.api.service.registration.RegistrationGroupStudentManagementService;
import com.msm.sis.api.service.registration.RegistrationGroupStudentOptionService;
import com.msm.sis.api.service.registration.RegistrationGroupUnassignedStudentAssignmentService;
import com.msm.sis.api.service.registration.RegistrationGroupUnassignedStudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registration-groups")
@Tag(name = "Registration Groups", description = "Registration group builder endpoints")
@RequiredArgsConstructor
public class RegistrationGroupController {
    private final RegistrationGroupBuilderPreviewService builderPreviewService;
    private final RegistrationGroupDetailService detailService;
    private final RegistrationGroupGenerationSaveService generationSaveService;
    private final RegistrationGroupNotificationService notificationService;
    private final RegistrationGroupPatchService patchService;
    private final RegistrationGroupPublishService publishService;
    private final RegistrationGroupPublishValidationService publishValidationService;
    private final RegistrationGroupReferenceDataService referenceDataService;
    private final RegistrationGroupSearchService searchService;
    private final RegistrationGroupSinglePublishService singlePublishService;
    private final RegistrationGroupStudentManagementService studentManagementService;
    private final RegistrationGroupStudentOptionService studentOptionService;
    private final RegistrationGroupUnassignedStudentAssignmentService unassignedStudentAssignmentService;
    private final RegistrationGroupUnassignedStudentService unassignedStudentService;

    @GetMapping("/reference-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get registration group reference options",
            description = "Returns academic years with terms, academic divisions, athletic sports, and registration group statuses."
    )
    public ResponseEntity<RegistrationGroupReferenceOptionsResponse> getReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getReferenceOptions());
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search registration groups",
            description = "Returns paginated registration groups filtered by academic year, term, group query, and status."
    )
    public ResponseEntity<RegistrationGroupSearchResponse> searchRegistrationGroups(
            @ModelAttribute RegistrationGroupSearchCriteria criteria
    ) {
        return ResponseEntity.ok(searchService.searchRegistrationGroups(criteria));
    }

    @GetMapping("/unassigned-students")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search unassigned registration students",
            description = "Returns active students not assigned to any registration group for the selected academic year and term."
    )
    public ResponseEntity<UnassignedRegistrationGroupStudentSearchResponse> searchUnassignedStudents(
            @ModelAttribute UnassignedRegistrationGroupStudentSearchCriteria criteria
    ) {
        return ResponseEntity.ok(unassignedStudentService.searchUnassignedStudents(criteria));
    }

    @PostMapping("/preview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Preview generated registration groups",
            description = "Runs the registration group student search and returns generated group previews without saving."
    )
    public ResponseEntity<RegistrationGroupBuilderPreviewResponse> previewRegistrationGroups(
            @RequestBody RegistrationGroupBuilderPreviewRequest request
    ) {
        return ResponseEntity.ok(builderPreviewService.previewRegistrationGroups(request));
    }

    @PostMapping("/generations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Save generated registration groups",
            description = "Persists the generation criteria, selected sports, generated groups, and generated student assignments."
    )
    public ResponseEntity<RegistrationGroupGenerationCreateResponse> saveGeneratedGroups(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestBody RegistrationGroupGenerationCreateRequest request
    ) {
        return ResponseEntity.ok(generationSaveService.saveGeneratedGroups(
                request,
                jwt == null ? null : jwt.getUserId()
        ));
    }

    @PostMapping("/publish/validate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Validate registration groups for publishing",
            description = "Returns blocking publish issues for the selected academic year and term without changing group status."
    )
    public ResponseEntity<RegistrationGroupPublishValidationResponse> validateRegistrationGroupsForPublish(
            @RequestBody RegistrationGroupPublishRequest request
    ) {
        return ResponseEntity.ok(publishValidationService.validateForPublish(request));
    }

    @PostMapping("/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Publish registration groups",
            description = "Re-runs publish validation, then moves eligible draft registration groups for the selected academic year and term to published."
    )
    public ResponseEntity<RegistrationGroupPublishResultResponse> publishRegistrationGroups(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestBody RegistrationGroupPublishRequest request
    ) {
        return ResponseEntity.ok(publishService.publishRegistrationGroups(
                request,
                jwt == null ? null : jwt.getUserId()
        ));
    }

    @PostMapping("/{registrationGroupId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Publish one registration group",
            description = "Validates and publishes one draft registration group."
    )
    public ResponseEntity<RegistrationGroupDetailResponse> publishRegistrationGroup(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long registrationGroupId
    ) {
        singlePublishService.publishRegistrationGroup(
                registrationGroupId,
                jwt == null ? null : jwt.getUserId()
        );
        return ResponseEntity.ok(detailService.getRegistrationGroupDetail(registrationGroupId));
    }

    @GetMapping("/{registrationGroupId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get registration group detail",
            description = "Returns registration group summary, registration window, saved generation criteria, counts, and assigned students."
    )
    public ResponseEntity<RegistrationGroupDetailResponse> getRegistrationGroupDetail(
            @PathVariable Long registrationGroupId
    ) {
        return ResponseEntity.ok(detailService.getRegistrationGroupDetail(registrationGroupId));
    }

    @PatchMapping("/{registrationGroupId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update a registration group",
            description = "Updates registration group name, academic period, registration window, or status."
    )
    public ResponseEntity<RegistrationGroupDetailResponse> patchRegistrationGroup(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long registrationGroupId,
            @RequestBody PatchRegistrationGroupRequest request
    ) {
        return ResponseEntity.ok(patchService.patchRegistrationGroup(
                registrationGroupId,
                request,
                jwt == null ? null : jwt.getUserId()
        ));
    }

    @PostMapping("/{registrationGroupId}/email-notifications/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Send a test registration group email",
            description = "Sends one test registration-window email for this registration group using the configured SMTP settings."
    )
    public ResponseEntity<RegistrationGroupEmailNotificationResponse> sendTestEmail(
            @PathVariable Long registrationGroupId
    ) {
        return ResponseEntity.ok(notificationService.sendTestNotificationForRegistrationGroup(registrationGroupId));
    }

    @PostMapping("/{registrationGroupId}/students")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Add a student to a registration group",
            description = "Adds one student to the registration group as a manual assignment."
    )
    public ResponseEntity<RegistrationGroupDetailResponse> addStudentToRegistrationGroup(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long registrationGroupId,
            @RequestBody AddRegistrationGroupStudentRequest request
    ) {
        return ResponseEntity.ok(studentManagementService.addStudent(
                registrationGroupId,
                request,
                jwt == null ? null : jwt.getUserId()
        ));
    }

    @PostMapping("/{registrationGroupId}/students/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Bulk assign unassigned students to a registration group",
            description = "Assigns selected students to the target registration group after verifying they are still unassigned for that academic year and term."
    )
    public ResponseEntity<BulkAssignRegistrationGroupStudentsResponse> bulkAssignStudentsToRegistrationGroup(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long registrationGroupId,
            @RequestBody BulkAssignRegistrationGroupStudentsRequest request
    ) {
        BulkAssignRegistrationGroupStudentsRequest effectiveRequest = request == null
                ? null
                : new BulkAssignRegistrationGroupStudentsRequest(registrationGroupId, request.studentIds());
        return ResponseEntity.ok(unassignedStudentAssignmentService.assignUnassignedStudents(
                effectiveRequest,
                jwt == null ? null : jwt.getUserId()
        ));
    }

    @DeleteMapping("/{registrationGroupId}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Remove a student from a registration group",
            description = "Removes one student assignment from the registration group."
    )
    public ResponseEntity<RegistrationGroupDetailResponse> removeStudentFromRegistrationGroup(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long registrationGroupId,
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(studentManagementService.removeStudent(
                registrationGroupId,
                studentId,
                jwt == null ? null : jwt.getUserId()
        ));
    }

    @GetMapping("/student-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search student options for registration groups",
            description = "Returns compact autocomplete results by student id, email, or name."
    )
    public ResponseEntity<RegistrationGroupStudentOptionsResponse> searchStudentOptions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long termId,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(studentOptionService.searchStudentOptions(
                search,
                academicYearId,
                termId,
                size
        ));
    }
}
