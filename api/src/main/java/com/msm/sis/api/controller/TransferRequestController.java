package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.transfer.ApproveTransferRequestRequest;
import com.msm.sis.api.dto.transfer.CreateTransferRequestRequest;
import com.msm.sis.api.dto.transfer.PatchTransferRequestWorkflowRequest;
import com.msm.sis.api.dto.transfer.StudentApprovedTransferRequestListResponse;
import com.msm.sis.api.dto.transfer.StudentTransferRequestSubmissionRequest;
import com.msm.sis.api.dto.transfer.TransferCourseEquivalencyDetailResponse;
import com.msm.sis.api.dto.transfer.TransferCourseEquivalencySummaryResponse;
import com.msm.sis.api.dto.transfer.TransferInstitutionOptionResponse;
import com.msm.sis.api.dto.transfer.TransferRequestAttachmentResponse;
import com.msm.sis.api.dto.transfer.TransferRequestCourseRequest;
import com.msm.sis.api.dto.transfer.TransferRequestCourseResponse;
import com.msm.sis.api.dto.transfer.TransferRequestInstitutionMatchRequest;
import com.msm.sis.api.dto.transfer.TransferRequestInstitutionRequest;
import com.msm.sis.api.dto.transfer.TransferRequestMappingComparisonResponse;
import com.msm.sis.api.dto.transfer.TransferRequestOutcomeRequest;
import com.msm.sis.api.dto.transfer.TransferRequestOutcomeResponse;
import com.msm.sis.api.dto.transfer.TransferRequestPolicyWaiverRequest;
import com.msm.sis.api.dto.transfer.TransferRequestPolicyWaiverResponse;
import com.msm.sis.api.dto.transfer.TransferRequestPolicyEvaluationResponse;
import com.msm.sis.api.dto.transfer.TransferRequestListResponse;
import com.msm.sis.api.dto.transfer.TransferRequestResponse;
import com.msm.sis.api.service.transfer.TransferRequestAttachmentService;
import com.msm.sis.api.service.transfer.TransferCourseEquivalencyService;
import com.msm.sis.api.service.transfer.TransferRequestCourseService;
import com.msm.sis.api.service.transfer.TransferRequestMappingComparisonService;
import com.msm.sis.api.service.transfer.TransferRequestOutcomeService;
import com.msm.sis.api.service.transfer.TransferRequestPolicyWaiverService;
import com.msm.sis.api.service.transfer.TransferRequestPolicyEvaluationService;
import com.msm.sis.api.service.transfer.TransferRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "transfer-request", description = "Manage transfer request workflow")
public class TransferRequestController {

    private final TransferRequestAttachmentService transferRequestAttachmentService;
    private final TransferCourseEquivalencyService transferCourseEquivalencyService;
    private final TransferRequestCourseService transferRequestCourseService;
    private final TransferRequestMappingComparisonService transferRequestMappingComparisonService;
    private final TransferRequestOutcomeService transferRequestOutcomeService;
    private final TransferRequestPolicyEvaluationService transferRequestPolicyEvaluationService;
    private final TransferRequestPolicyWaiverService transferRequestPolicyWaiverService;
    private final TransferRequestService transferRequestService;

    public TransferRequestController(
            TransferRequestAttachmentService transferRequestAttachmentService,
            TransferCourseEquivalencyService transferCourseEquivalencyService,
            TransferRequestCourseService transferRequestCourseService,
            TransferRequestMappingComparisonService transferRequestMappingComparisonService,
            TransferRequestOutcomeService transferRequestOutcomeService,
            TransferRequestPolicyEvaluationService transferRequestPolicyEvaluationService,
            TransferRequestPolicyWaiverService transferRequestPolicyWaiverService,
            TransferRequestService transferRequestService
    ) {
        this.transferRequestAttachmentService = transferRequestAttachmentService;
        this.transferCourseEquivalencyService = transferCourseEquivalencyService;
        this.transferRequestCourseService = transferRequestCourseService;
        this.transferRequestMappingComparisonService = transferRequestMappingComparisonService;
        this.transferRequestOutcomeService = transferRequestOutcomeService;
        this.transferRequestPolicyEvaluationService = transferRequestPolicyEvaluationService;
        this.transferRequestPolicyWaiverService = transferRequestPolicyWaiverService;
        this.transferRequestService = transferRequestService;
    }

    @GetMapping("/admin/transfer-requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List transfer requests",
            description = "Returns transfer requests in submission order for the registrar queue."
    )
    public ResponseEntity<TransferRequestListResponse> listRequests(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(value = "studentName", required = false) String studentName,
            @RequestParam(value = "studentEmail", required = false) String studentEmail,
            @RequestParam(value = "studentId", required = false) String studentId,
            @RequestParam(value = "classOf", required = false) Integer classOf,
            @RequestParam(value = "division", required = false) String division,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "sortDirection", required = false) String sortDirection
    ) {
        return ResponseEntity.ok(transferRequestService.listRequests(
                studentName,
                studentEmail,
                studentId,
                classOf,
                division,
                status,
                sortDirection
        ));
    }

    @PostMapping("/admin/transfer-requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Submit transfer request for a student",
            description = "Creates a submitted transfer request and resolves the effective policy at submission time."
    )
    public ResponseEntity<TransferRequestResponse> submitTransferRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
        @Valid @NotNull @RequestBody CreateTransferRequestRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transferRequestService.submitTransferRequest(request, jwt));
    }

    @GetMapping("/admin/transfer-requests/{transferRequestId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get transfer request detail",
            description = "Returns a transfer request with student, institution, policy, and primary course details."
    )
    public ResponseEntity<TransferRequestResponse> getRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) {
        return ResponseEntity.ok(transferRequestService.getRequest(transferRequestId));
    }

    @GetMapping("/admin/transfer-requests/{transferRequestId}/mapping-comparison")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Compare saved and proposed transfer mappings",
            description = "Returns the active saved institution mapping and proposed request outcomes before approval."
    )
    public ResponseEntity<TransferRequestMappingComparisonResponse> getMappingComparison(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) {
        return ResponseEntity.ok(transferRequestMappingComparisonService.compare(transferRequestId));
    }

    @PutMapping("/admin/transfer-requests/{transferRequestId}/institution")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update transfer request institution",
            description = "Updates saved or one-off institution fields for a transfer request."
    )
    public ResponseEntity<TransferRequestResponse> updateInstitution(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @Valid @NotNull @RequestBody TransferRequestInstitutionRequest request
    ) {
        return ResponseEntity.ok(transferRequestService.updateInstitution(transferRequestId, request, jwt));
    }

    @PatchMapping("/admin/transfer-requests/{transferRequestId}/matched-institution")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update transfer request matched institution",
            description = "Links or clears the saved transfer institution match without changing the student-entered institution snapshot."
    )
    public ResponseEntity<TransferRequestResponse> updateMatchedInstitution(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @Valid @NotNull @RequestBody TransferRequestInstitutionMatchRequest request
    ) {
        return ResponseEntity.ok(transferRequestService.updateMatchedInstitution(transferRequestId, request, jwt));
    }

    @GetMapping("/student/transfer-requests")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "List current student's transfer requests",
            description = "Returns transfer requests submitted by the authenticated student."
    )
    public ResponseEntity<TransferRequestListResponse> listCurrentStudentRequests(
            @AuthenticationPrincipal AuthenticatedJwt jwt
    ) {
        return ResponseEntity.ok(transferRequestService.listStudentRequests(jwt));
    }

    @GetMapping("/student/transfer-requests/{transferRequestId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Get current student's transfer request detail",
            description = "Returns one transfer request if it belongs to the authenticated student."
    )
    public ResponseEntity<TransferRequestResponse> getCurrentStudentRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) {
        return ResponseEntity.ok(transferRequestService.getStudentRequest(jwt, transferRequestId));
    }

    @GetMapping("/student/transfer-requests/approved")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "List current student's approved transfer requests",
            description = "Returns approved transfer requests for the authenticated student without admin-only workflow or policy data."
    )
    public ResponseEntity<StudentApprovedTransferRequestListResponse> listCurrentStudentApprovedRequests(
            @AuthenticationPrincipal AuthenticatedJwt jwt
    ) {
        return ResponseEntity.ok(transferRequestService.listCurrentStudentApprovedRequests(jwt));
    }

    @GetMapping("/student/transfer-institutions")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "List saved transfer institutions",
            description = "Returns active saved transfer institutions for the student transfer request form."
    )
    public ResponseEntity<List<TransferInstitutionOptionResponse>> listStudentTransferInstitutions(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(value = "search", required = false) String search
    ) {
        return ResponseEntity.ok(transferRequestService.listSavedInstitutions(search));
    }

    @GetMapping("/admin/transfer-institutions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List saved transfer institutions for admin matching",
            description = "Returns active saved transfer institutions for the transfer request institution matching modal."
    )
    public ResponseEntity<List<TransferInstitutionOptionResponse>> listAdminTransferInstitutions(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(value = "search", required = false) String search
    ) {
        return ResponseEntity.ok(transferRequestService.listSavedInstitutions(search));
    }

    @GetMapping("/admin/transfer-institutions/{transferInstitutionId}/course-equivalencies")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List saved course equivalencies for a transfer institution",
            description = "Returns saved external courses that can prepopulate transfer request outcomes."
    )
    public ResponseEntity<List<TransferCourseEquivalencySummaryResponse>> listInstitutionCourseEquivalencies(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferInstitutionId,
            @RequestParam(value = "search", required = false) String search
    ) {
        return ResponseEntity.ok(transferCourseEquivalencyService.listInstitutionEquivalencies(
                transferInstitutionId,
                search
        ));
    }

    @GetMapping("/admin/transfer-institution-course-equivalencies/{transferCourseEquivalencyId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get saved course equivalency detail",
            description = "Returns external transfer course details and saved outcomes for prepopulation."
    )
    public ResponseEntity<TransferCourseEquivalencyDetailResponse> getInstitutionCourseEquivalency(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferCourseEquivalencyId
    ) {
        return ResponseEntity.ok(transferCourseEquivalencyService.getEquivalency(transferCourseEquivalencyId));
    }

    @PostMapping("/student/transfer-request-submissions")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Submit current student's transfer request",
            description = "Creates a submitted transfer request for the authenticated student using student-entered form fields."
    )
    public ResponseEntity<TransferRequestResponse> submitCurrentStudentTransferRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody StudentTransferRequestSubmissionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transferRequestService.submitCurrentStudentTransferRequest(jwt, request));
    }

    @PatchMapping("/admin/transfer-requests/{transferRequestId}/workflow")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update transfer request workflow",
            description = "Moves a transfer request through registrar workflow and records decision metadata."
    )
    public ResponseEntity<TransferRequestResponse> updateWorkflow(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @Valid @NotNull @RequestBody PatchTransferRequestWorkflowRequest request
    ) {
        return ResponseEntity.ok(transferRequestService.updateWorkflow(transferRequestId, request, jwt));
    }

    @PostMapping("/admin/transfer-requests/{transferRequestId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Approve transfer request",
            description = "Approves a transfer request, validates policy checks, optionally saves institution mappings, and posts transcript credit."
    )
    public ResponseEntity<TransferRequestResponse> approveRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @Valid @NotNull @RequestBody ApproveTransferRequestRequest request
    ) {
        return ResponseEntity.ok(transferRequestService.approveRequest(transferRequestId, request, jwt));
    }

    @GetMapping("/admin/transfer-requests/{transferRequestId}/policy-evaluation")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Evaluate transfer request policy checks",
            description = "Evaluates the global policy effective on the submitted date and applies request-scoped waivers."
    )
    public ResponseEntity<TransferRequestPolicyEvaluationResponse> evaluatePolicy(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) {
        return ResponseEntity.ok(transferRequestPolicyEvaluationService.evaluate(transferRequestId));
    }

    @GetMapping("/admin/transfer-requests/{transferRequestId}/policy-waivers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List transfer request policy waivers",
            description = "Returns request-scoped waivers for global transfer policy checks."
    )
    public ResponseEntity<List<TransferRequestPolicyWaiverResponse>> listPolicyWaivers(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) {
        return ResponseEntity.ok(transferRequestPolicyWaiverService.listWaivers(transferRequestId));
    }

    @PutMapping("/admin/transfer-requests/{transferRequestId}/policy-waivers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Upsert transfer request policy waiver",
            description = "Creates or updates a request-scoped waiver without changing the global policy."
    )
    public ResponseEntity<TransferRequestPolicyWaiverResponse> upsertPolicyWaiver(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @Valid @NotNull @RequestBody TransferRequestPolicyWaiverRequest request
    ) {
        return ResponseEntity.ok(transferRequestPolicyWaiverService.upsertWaiver(transferRequestId, request, jwt));
    }

    @DeleteMapping("/admin/transfer-requests/{transferRequestId}/policy-waivers/{policyCheckType}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Remove transfer request policy waiver",
            description = "Removes a request-scoped waiver for a global transfer policy check."
    )
    public ResponseEntity<Void> removePolicyWaiver(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @PathVariable String policyCheckType
    ) {
        transferRequestPolicyWaiverService.removeWaiver(transferRequestId, policyCheckType);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/transfer-requests/{transferRequestId}/courses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List transfer request courses",
            description = "Returns requested course details for a transfer request."
    )
    public ResponseEntity<List<TransferRequestCourseResponse>> listCourses(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) {
        return ResponseEntity.ok(transferRequestCourseService.listCourses(transferRequestId));
    }

    @PutMapping("/admin/transfer-requests/{transferRequestId}/courses/primary")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Upsert transfer request primary course",
            description = "Creates or updates the first requested course for a transfer request."
    )
    public ResponseEntity<TransferRequestCourseResponse> upsertPrimaryCourse(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @Valid @NotNull @RequestBody TransferRequestCourseRequest request
    ) {
        return ResponseEntity.ok(transferRequestCourseService.upsertPrimaryCourse(transferRequestId, request));
    }

    @GetMapping("/admin/transfer-request-courses/{transferRequestCourseId}/outcomes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "List transfer request course outcomes",
            description = "Returns transfer credit, course substitution, and requirement waiver outcomes."
    )
    public ResponseEntity<List<TransferRequestOutcomeResponse>> listOutcomes(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestCourseId
    ) {
        return ResponseEntity.ok(transferRequestOutcomeService.listOutcomes(transferRequestCourseId));
    }

    @PostMapping("/admin/transfer-request-courses/{transferRequestCourseId}/outcomes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create transfer request outcome",
            description = "Adds an approved outcome to a requested transfer course."
    )
    public ResponseEntity<TransferRequestOutcomeResponse> createOutcome(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestCourseId,
            @Valid @NotNull @RequestBody TransferRequestOutcomeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transferRequestOutcomeService.createOutcome(transferRequestCourseId, request, jwt));
    }

    @PostMapping("/admin/transfer-request-courses/{transferRequestCourseId}/outcomes/from-equivalency/{transferCourseEquivalencyId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create transfer request outcomes from saved equivalency",
            description = "Copies saved institution equivalency outcomes into the current transfer request course."
    )
    public ResponseEntity<List<TransferRequestOutcomeResponse>> createOutcomesFromEquivalency(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestCourseId,
            @PathVariable Long transferCourseEquivalencyId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transferRequestOutcomeService.createOutcomesFromEquivalency(
                        transferRequestCourseId,
                        transferCourseEquivalencyId,
                        jwt
                ));
    }

    @PatchMapping("/admin/transfer-request-outcomes/{transferRequestOutcomeId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update transfer request outcome",
            description = "Updates an approved outcome and records the current approver and approval time."
    )
    public ResponseEntity<TransferRequestOutcomeResponse> updateOutcome(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestOutcomeId,
            @Valid @NotNull @RequestBody TransferRequestOutcomeRequest request
    ) {
        return ResponseEntity.ok(transferRequestOutcomeService.updateOutcome(transferRequestOutcomeId, request, jwt));
    }

    @DeleteMapping("/admin/transfer-request-outcomes/{transferRequestOutcomeId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete transfer request outcome",
            description = "Removes a transfer credit, course substitution, or requirement waiver outcome."
    )
    public ResponseEntity<Void> deleteOutcome(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestOutcomeId
    ) {
        transferRequestOutcomeService.deleteOutcome(transferRequestOutcomeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/transfer-requests/{transferRequestId}/attachments/transcript")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get transfer request transcript metadata",
            description = "Returns the transcript PDF attachment metadata for a transfer request."
    )
    public ResponseEntity<TransferRequestAttachmentResponse> getTranscriptAttachment(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) {
        return ResponseEntity.ok(transferRequestAttachmentService.getTranscriptAttachment(transferRequestId));
    }

    @PostMapping(
            value = "/admin/transfer-requests/{transferRequestId}/attachments/transcript",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Upload transfer request transcript",
            description = "Stores or replaces the single transcript PDF attachment for a transfer request."
    )
    public ResponseEntity<TransferRequestAttachmentResponse> uploadTranscriptAttachment(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(
                transferRequestAttachmentService.uploadTranscriptAttachment(transferRequestId, file, jwt)
        );
    }

    @GetMapping("/admin/transfer-requests/{transferRequestId}/attachments/transcript/download")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Download transfer request transcript",
            description = "Downloads the transcript PDF attachment for a transfer request."
    )
    public ResponseEntity<Resource> downloadTranscriptAttachment(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long transferRequestId
    ) throws IOException {
        TransferRequestAttachmentService.TransferRequestAttachmentDownload download;
        try {
            download = transferRequestAttachmentService.getTranscriptAttachmentDownload(transferRequestId);
        } catch (IOException exception) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(download.originalFileName())
                                .build()
                                .toString()
                )
                .body(download.resource());
    }
}
