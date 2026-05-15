package com.msm.sis.api.service.transfer;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.transfer.ApproveTransferRequestRequest;
import com.msm.sis.api.dto.transfer.CreateTransferRequestRequest;
import com.msm.sis.api.dto.transfer.PatchTransferRequestWorkflowRequest;
import com.msm.sis.api.dto.transfer.StudentApprovedTransferRequestCourseResponse;
import com.msm.sis.api.dto.transfer.StudentApprovedTransferRequestListResponse;
import com.msm.sis.api.dto.transfer.StudentApprovedTransferRequestOutcomeResponse;
import com.msm.sis.api.dto.transfer.StudentApprovedTransferRequestResponse;
import com.msm.sis.api.dto.transfer.StudentTransferRequestCourseRequest;
import com.msm.sis.api.dto.transfer.StudentTransferRequestInstitutionRequest;
import com.msm.sis.api.dto.transfer.StudentTransferRequestSubmissionRequest;
import com.msm.sis.api.dto.transfer.TransferInstitutionOptionResponse;
import com.msm.sis.api.dto.transfer.TransferRequestCourseRequest;
import com.msm.sis.api.dto.transfer.TransferRequestInstitutionMatchRequest;
import com.msm.sis.api.dto.transfer.TransferRequestInstitutionRequest;
import com.msm.sis.api.dto.transfer.TransferRequestInstitutionResponse;
import com.msm.sis.api.dto.transfer.TransferRequestListResponse;
import com.msm.sis.api.dto.transfer.TransferRequestPolicyEvaluationResponse;
import com.msm.sis.api.dto.transfer.TransferRequestResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.TransferRequestCourse;
import com.msm.sis.api.entity.TransferCreditPolicy;
import com.msm.sis.api.entity.TransferInstitution;
import com.msm.sis.api.entity.TransferRequestOutcome;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.repository.StudentAcademicCareerRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.TransferCreditPolicyRepository;
import com.msm.sis.api.repository.TransferInstitutionRepository;
import com.msm.sis.api.repository.TransferRequestCourseRepository;
import com.msm.sis.api.repository.TransferRequestOutcomeRepository;
import com.msm.sis.api.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class TransferRequestService {

    private static final String STATUS_SUBMITTED = "SUBMITTED";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_DENIED = "DENIED";
    private static final String INSTITUTION_LEVEL_TWO_YEAR = "TWO_YEAR";
    private static final String INSTITUTION_LEVEL_FOUR_YEAR = "FOUR_YEAR";

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            STATUS_SUBMITTED,
            "WAITING_FOR_MORE_INFO",
            "REGISTRAR_REVIEW",
            STATUS_APPROVED,
            STATUS_DENIED,
            "CANCELLED"
    );

    private final StudentRepository studentRepository;
    private final StudentAcademicCareerRepository studentAcademicCareerRepository;
    private final SisUserRepository sisUserRepository;
    private final TransferCreditPolicyRepository transferCreditPolicyRepository;
    private final TransferCourseEquivalencyMappingService transferCourseEquivalencyMappingService;
    private final TransferRequestApprovalPostingService transferRequestApprovalPostingService;
    private final TransferRequestCourseService transferRequestCourseService;
    private final TransferRequestCourseRepository transferRequestCourseRepository;
    private final TransferInstitutionRepository transferInstitutionRepository;
    private final TransferRequestOutcomeRepository transferRequestOutcomeRepository;
    private final TransferRequestPolicyEvaluationService transferRequestPolicyEvaluationService;
    private final TransferRequestRepository transferRequestRepository;

    @Transactional(readOnly = true)
    public TransferRequestListResponse listRequests(
            String studentName,
            String studentEmail,
            String studentIdentifier,
            Integer classOf,
            String division,
            String status,
            String sortDirection
    ) {
        List<TransferRequest> transferRequests = transferRequestRepository.searchRequests(
                trimToNull(studentName),
                trimToNull(studentEmail),
                trimToNull(studentIdentifier),
                classOf,
                trimToNull(division),
                normalizeOptionalStatus(status)
        );

        if ("desc".equalsIgnoreCase(trimToNull(sortDirection))) {
            Collections.reverse(transferRequests);
        }

        return new TransferRequestListResponse(mapTransferRequestResponses(transferRequests));
    }

    @Transactional(readOnly = true)
    public List<TransferInstitutionOptionResponse> listSavedInstitutions(String search) {
        String trimmedSearch = trimToNull(search);

        return (trimmedSearch == null
                ? transferInstitutionRepository.findTop20ByActiveTrueOrderByNameAsc()
                : transferInstitutionRepository.findTop20ByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(
                        trimmedSearch
                ))
                .stream()
                .map(this::mapTransferInstitutionOptionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransferRequestResponse getRequest(Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));

        return mapTransferRequestResponse(transferRequest);
    }

    @Transactional
    public TransferRequestResponse updateInstitution(
            Long transferRequestId,
            TransferRequestInstitutionRequest request,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestId, "Transfer request id");
        requireRequestBody(request);

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
        applyInstitution(transferRequest, request, jwt);

        return mapTransferRequestResponse(transferRequestRepository.save(transferRequest));
    }

    @Transactional
    public TransferRequestResponse updateMatchedInstitution(
            Long transferRequestId,
            TransferRequestInstitutionMatchRequest request,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestId, "Transfer request id");
        requireRequestBody(request);

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
        applyMatchedInstitution(transferRequest, request.transferInstitutionId(), jwt);

        return mapTransferRequestResponse(transferRequestRepository.save(transferRequest));
    }

    @Transactional(readOnly = true)
    public TransferRequestListResponse listStudentRequests(AuthenticatedJwt jwt) {
        Student student = studentRepository.findByUserId(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));

        List<TransferRequest> transferRequests = transferRequestRepository.findByStudentIdOrderBySubmittedAtDescIdDesc(
                student.getId()
        );
        return new TransferRequestListResponse(mapTransferRequestResponses(transferRequests));
    }

    @Transactional(readOnly = true)
    public TransferRequestResponse getStudentRequest(AuthenticatedJwt jwt, Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");

        Student student = studentRepository.findByUserId(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
        if (!transferRequest.getStudent().getId().equals(student.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found.");
        }

        return mapTransferRequestResponse(transferRequest);
    }

    @Transactional(readOnly = true)
    public StudentApprovedTransferRequestListResponse listCurrentStudentApprovedRequests(AuthenticatedJwt jwt) {
        Student student = studentRepository.findByUserId(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));

        List<TransferRequest> transferRequests = transferRequestRepository
                .findByStudentIdAndStatusOrderByDecidedAtDescIdDesc(student.getId(), STATUS_APPROVED);
        Map<Long, List<TransferRequestCourse>> coursesByRequestId = findCoursesByRequestId(transferRequests);
        Map<Long, List<TransferRequestOutcome>> outcomesByCourseId = findOutcomesByCourseId(coursesByRequestId);

        return new StudentApprovedTransferRequestListResponse(transferRequests.stream()
                .map(transferRequest -> mapStudentApprovedTransferRequestResponse(
                        transferRequest,
                        coursesByRequestId,
                        outcomesByCourseId
                ))
                .toList());
    }

    @Transactional
    public TransferRequestResponse submitTransferRequest(CreateTransferRequestRequest request, AuthenticatedJwt jwt) {
        requireRequestBody(request);
        requirePositiveId(request.studentId(), "Student id");

        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));

        TransferRequest transferRequest = buildSubmittedRequest(student);
        applyInstitution(transferRequest, request.institution(), jwt);
        TransferRequest savedRequest = transferRequestRepository.save(transferRequest);
        createInitialCourse(savedRequest, request.course());
        return mapTransferRequestResponse(savedRequest);
    }

    @Transactional
    public TransferRequestResponse submitCurrentStudentTransferRequest(
            AuthenticatedJwt jwt,
            StudentTransferRequestSubmissionRequest request
    ) {
        requireRequestBody(request);
        Student student = studentRepository.findByUserId(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));

        TransferRequest transferRequest = buildSubmittedRequest(student);
        applyStudentSubmittedInstitution(transferRequest, request.institution());
        TransferRequest savedRequest = transferRequestRepository.save(transferRequest);
        createInitialCourse(savedRequest, mapStudentCourseRequest(request.course()));
        return mapTransferRequestResponse(savedRequest);
    }

    @Transactional
    public TransferRequestResponse updateWorkflow(
            Long transferRequestId,
            PatchTransferRequestWorkflowRequest request,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestId, "Transfer request id");
        requireRequestBody(request);

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));

        String nextStatus = normalizeStatus(request.status());
        transferRequest.setStatus(nextStatus);
        transferRequest.setDecisionNotes(trimToNull(request.decisionNotes()));

        if (isDecisionStatus(nextStatus)) {
            transferRequest.setDecidedByUser(findCurrentUser(jwt));
            transferRequest.setDecidedAt(LocalDateTime.now());
        } else {
            transferRequest.setDecidedByUser(null);
            transferRequest.setDecidedAt(null);
        }

        TransferRequest savedTransferRequest = transferRequestRepository.save(transferRequest);
        if (STATUS_APPROVED.equals(nextStatus)) {
            transferRequestApprovalPostingService.postApprovedRequest(savedTransferRequest.getId());
        }

        return mapTransferRequestResponse(savedTransferRequest);
    }

    @Transactional
    public TransferRequestResponse approveRequest(
            Long transferRequestId,
            ApproveTransferRequestRequest request,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestId, "Transfer request id");
        requireRequestBody(request);

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
        if (STATUS_APPROVED.equals(transferRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Transfer request is already approved.");
        }

        SisUser currentUser = findCurrentUser(jwt);
        if (Boolean.TRUE.equals(request.saveInstitution()) && transferRequest.getTransferInstitution() == null) {
            TransferInstitution savedInstitution = saveSubmittedInstitution(transferRequest);
            transferRequest.setTransferInstitution(savedInstitution);
            transferRequest.setInstitutionLevel(resolveInstitutionLevelForSavedInstitution(savedInstitution));
            transferRequest.setInstitutionMatchedByUser(currentUser);
            transferRequest.setInstitutionMatchedAt(LocalDateTime.now());
            transferRequestRepository.saveAndFlush(transferRequest);
        }

        validatePolicyChecksForApproval(transferRequest.getId());

        transferRequest.setStatus(STATUS_APPROVED);
        transferRequest.setDecisionNotes(trimToNull(request.decisionNotes()));
        transferRequest.setDecidedByUser(currentUser);
        transferRequest.setDecidedAt(LocalDateTime.now());
        TransferRequest savedTransferRequest = transferRequestRepository.saveAndFlush(transferRequest);

        if (Boolean.TRUE.equals(request.saveOrUpdateInstitutionMapping())) {
            transferCourseEquivalencyMappingService.saveOrUpdateMappingsFromRequest(savedTransferRequest, currentUser);
        }

        transferRequestApprovalPostingService.postApprovedRequest(savedTransferRequest.getId());
        return mapTransferRequestResponse(savedTransferRequest);
    }

    private TransferRequest buildSubmittedRequest(Student student) {
        TransferRequest transferRequest = new TransferRequest();
        transferRequest.setStudent(student);
        transferRequest.setPolicy(resolveCurrentPolicy());
        transferRequest.setStatus(STATUS_SUBMITTED);
        transferRequest.setSubmittedAt(LocalDateTime.now());
        return transferRequest;
    }

    private void validatePolicyChecksForApproval(Long transferRequestId) {
        TransferRequestPolicyEvaluationResponse policyEvaluation = transferRequestPolicyEvaluationService.evaluate(
                transferRequestId
        );
        if (policyEvaluation.hasFailures()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Transfer request has failing policy checks that must pass or be waived before approval."
            );
        }
    }

    private TransferInstitution saveSubmittedInstitution(TransferRequest transferRequest) {
        String institutionName = trimToNull(transferRequest.getOneOffInstitutionName());
        if (institutionName == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Transfer request must include a submitted institution name before saving institution."
            );
        }

        String code = "TRREQ-" + transferRequest.getId();
        TransferInstitution institution = transferInstitutionRepository.findByCode(code)
                .orElseGet(TransferInstitution::new);
        institution.setCode(code);
        institution.setName(institutionName);
        institution.setInstitutionLevel(transferRequest.getInstitutionLevel());
        institution.setAddressLine1(transferRequest.getOneOffInstitutionAddressLine1());
        institution.setAddressLine2(transferRequest.getOneOffInstitutionAddressLine2());
        institution.setCity(transferRequest.getOneOffInstitutionCity());
        institution.setStateRegion(transferRequest.getOneOffInstitutionStateRegion());
        institution.setPostalCode(transferRequest.getOneOffInstitutionPostalCode());
        institution.setCountryCode(transferRequest.getOneOffInstitutionCountryCode());
        institution.setWebsite(transferRequest.getOneOffInstitutionWebsite());
        institution.setActive(true);
        return transferInstitutionRepository.save(institution);
    }

    private void createInitialCourse(TransferRequest transferRequest, TransferRequestCourseRequest courseRequest) {
        if (courseRequest == null) {
            return;
        }

        transferRequestCourseService.upsertPrimaryCourse(transferRequest.getId(), courseRequest);
    }

    private TransferRequestCourseRequest mapStudentCourseRequest(StudentTransferRequestCourseRequest request) {
        return new TransferRequestCourseRequest(
                request.externalSubjectCode(),
                request.externalCourseNumber(),
                request.externalCourseTitle(),
                request.externalCourseDescription(),
                request.externalTerm(),
                request.requestedCredits(),
                request.attemptedCredits(),
                null,
                null,
                request.reason(),
                request.studentNotes(),
                request.requestedLocalCourseEquivalent()
        );
    }

    private void applyStudentSubmittedInstitution(
            TransferRequest transferRequest,
            StudentTransferRequestInstitutionRequest institutionRequest
    ) {
        transferRequest.setTransferInstitution(null);
        transferRequest.setInstitutionMatchedByUser(null);
        transferRequest.setInstitutionMatchedAt(null);
        transferRequest.setOneOffInstitutionName(trimToNull(institutionRequest.oneOffInstitutionName()));
        transferRequest.setOneOffInstitutionAddressLine1(trimToNull(institutionRequest.oneOffInstitutionAddressLine1()));
        transferRequest.setOneOffInstitutionAddressLine2(trimToNull(institutionRequest.oneOffInstitutionAddressLine2()));
        transferRequest.setOneOffInstitutionCity(trimToNull(institutionRequest.oneOffInstitutionCity()));
        transferRequest.setOneOffInstitutionStateRegion(trimToNull(institutionRequest.oneOffInstitutionStateRegion()));
        transferRequest.setOneOffInstitutionPostalCode(trimToNull(institutionRequest.oneOffInstitutionPostalCode()));
        transferRequest.setOneOffInstitutionCountryCode(
                normalizeCountryCode(institutionRequest.oneOffInstitutionCountryCode())
        );
        transferRequest.setOneOffInstitutionWebsite(trimToNull(institutionRequest.oneOffInstitutionWebsite()));
        transferRequest.setInstitutionLevel(null);
    }

    private void applyInstitution(
            TransferRequest transferRequest,
            TransferRequestInstitutionRequest institutionRequest,
            AuthenticatedJwt jwt
    ) {
        if (institutionRequest == null) {
            return;
        }

        Long transferInstitutionId = institutionRequest.transferInstitutionId();

        TransferInstitution savedInstitution = null;
        if (transferInstitutionId != null) {
            requirePositiveId(transferInstitutionId, "Transfer institution id");
            savedInstitution = transferInstitutionRepository.findById(transferInstitutionId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Transfer institution was not found."
                    ));
            boolean isNewMatch = transferRequest.getTransferInstitution() == null
                    || !transferInstitutionId.equals(transferRequest.getTransferInstitution().getId());
            transferRequest.setTransferInstitution(savedInstitution);
            if (isNewMatch && jwt != null) {
                transferRequest.setInstitutionMatchedByUser(findCurrentUser(jwt));
                transferRequest.setInstitutionMatchedAt(LocalDateTime.now());
            }
        } else {
            transferRequest.setTransferInstitution(null);
            transferRequest.setInstitutionMatchedByUser(null);
            transferRequest.setInstitutionMatchedAt(null);
        }

        if (hasSubmittedInstitutionSnapshotFields(institutionRequest)) {
            transferRequest.setOneOffInstitutionName(trimToNull(institutionRequest.oneOffInstitutionName()));
            transferRequest.setOneOffInstitutionAddressLine1(trimToNull(institutionRequest.oneOffInstitutionAddressLine1()));
            transferRequest.setOneOffInstitutionAddressLine2(trimToNull(institutionRequest.oneOffInstitutionAddressLine2()));
            transferRequest.setOneOffInstitutionCity(trimToNull(institutionRequest.oneOffInstitutionCity()));
            transferRequest.setOneOffInstitutionStateRegion(trimToNull(institutionRequest.oneOffInstitutionStateRegion()));
            transferRequest.setOneOffInstitutionPostalCode(trimToNull(institutionRequest.oneOffInstitutionPostalCode()));
            transferRequest.setOneOffInstitutionCountryCode(
                    normalizeCountryCode(institutionRequest.oneOffInstitutionCountryCode())
            );
            transferRequest.setOneOffInstitutionWebsite(trimToNull(institutionRequest.oneOffInstitutionWebsite()));
        }
        transferRequest.setInstitutionLevel(resolveInstitutionLevel(institutionRequest, savedInstitution));
    }

    private void applyMatchedInstitution(
            TransferRequest transferRequest,
            Long transferInstitutionId,
            AuthenticatedJwt jwt
    ) {
        if (transferInstitutionId == null) {
            transferRequest.setTransferInstitution(null);
            transferRequest.setInstitutionMatchedByUser(null);
            transferRequest.setInstitutionMatchedAt(null);
            return;
        }

        requirePositiveId(transferInstitutionId, "Transfer institution id");
        TransferInstitution savedInstitution = transferInstitutionRepository.findById(transferInstitutionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer institution was not found."
                ));

        boolean isNewMatch = transferRequest.getTransferInstitution() == null
                || !transferInstitutionId.equals(transferRequest.getTransferInstitution().getId());
        transferRequest.setTransferInstitution(savedInstitution);
        transferRequest.setInstitutionLevel(resolveInstitutionLevelForSavedInstitution(savedInstitution));
        if (isNewMatch) {
            transferRequest.setInstitutionMatchedByUser(findCurrentUser(jwt));
            transferRequest.setInstitutionMatchedAt(LocalDateTime.now());
        }
    }

    private boolean hasSubmittedInstitutionSnapshotFields(TransferRequestInstitutionRequest institutionRequest) {
        return institutionRequest.oneOffInstitutionName() != null
                || institutionRequest.oneOffInstitutionAddressLine1() != null
                || institutionRequest.oneOffInstitutionAddressLine2() != null
                || institutionRequest.oneOffInstitutionCity() != null
                || institutionRequest.oneOffInstitutionStateRegion() != null
                || institutionRequest.oneOffInstitutionPostalCode() != null
                || institutionRequest.oneOffInstitutionCountryCode() != null
                || institutionRequest.oneOffInstitutionWebsite() != null;
    }

    private String resolveInstitutionLevel(
            TransferRequestInstitutionRequest institutionRequest,
            TransferInstitution savedInstitution
    ) {
        String requestedInstitutionLevel = normalizeInstitutionLevel(institutionRequest.institutionLevel());
        if (requestedInstitutionLevel != null) {
            return requestedInstitutionLevel;
        }

        return savedInstitution == null ? null : normalizeInstitutionLevel(savedInstitution.getInstitutionLevel());
    }

    private String resolveInstitutionLevelForSavedInstitution(TransferInstitution savedInstitution) {
        return savedInstitution == null ? null : normalizeInstitutionLevel(savedInstitution.getInstitutionLevel());
    }

    private String normalizeInstitutionLevel(String institutionLevel) {
        String normalizedInstitutionLevel = trimToNull(institutionLevel);
        if (normalizedInstitutionLevel == null) {
            return null;
        }

        normalizedInstitutionLevel = normalizedInstitutionLevel.toUpperCase().replace('-', '_').replace(' ', '_');
        if ("TWO".equals(normalizedInstitutionLevel) || "2_YEAR".equals(normalizedInstitutionLevel)) {
            normalizedInstitutionLevel = INSTITUTION_LEVEL_TWO_YEAR;
        }
        if ("FOUR".equals(normalizedInstitutionLevel) || "4_YEAR".equals(normalizedInstitutionLevel)) {
            normalizedInstitutionLevel = INSTITUTION_LEVEL_FOUR_YEAR;
        }

        if (!INSTITUTION_LEVEL_TWO_YEAR.equals(normalizedInstitutionLevel)
                && !INSTITUTION_LEVEL_FOUR_YEAR.equals(normalizedInstitutionLevel)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Institution level is invalid.");
        }

        return normalizedInstitutionLevel;
    }

    private String normalizeCountryCode(String countryCode) {
        String normalizedCountryCode = trimToNull(countryCode);
        if (normalizedCountryCode == null) {
            return null;
        }

        if (normalizedCountryCode.length() != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Institution country code must be two letters.");
        }

        return normalizedCountryCode.toUpperCase();
    }

    private TransferCreditPolicy resolveCurrentPolicy() {
        return transferCreditPolicyRepository.findEffectivePolicyForDate(LocalDate.now())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No transfer credit policy is effective for today."
                ));
    }

    private SisUser findCurrentUser(AuthenticatedJwt jwt) {
        return sisUserRepository.findById(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user was not found."));
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = trimToNull(status);
        if (normalizedStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transfer request status is required.");
        }

        normalizedStatus = normalizedStatus.toUpperCase().replace(' ', '_');
        if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transfer request status is invalid.");
        }

        return normalizedStatus;
    }

    private String normalizeOptionalStatus(String status) {
        String normalizedStatus = trimToNull(status);
        return normalizedStatus == null ? null : normalizeStatus(normalizedStatus);
    }

    private boolean isDecisionStatus(String status) {
        return STATUS_APPROVED.equals(status) || STATUS_DENIED.equals(status);
    }

    private List<TransferRequestResponse> mapTransferRequestResponses(List<TransferRequest> transferRequests) {
        Map<Long, TransferRequestCourse> primaryCourseByRequestId = findPrimaryCourseByRequestId(transferRequests);
        Map<Long, List<String>> divisionNamesByStudentId = findDivisionNamesByStudentId(transferRequests);

        return transferRequests.stream()
                .map(transferRequest -> mapTransferRequestResponse(
                        transferRequest,
                        primaryCourseByRequestId,
                        divisionNamesByStudentId
                ))
                .toList();
    }

    private TransferRequestResponse mapTransferRequestResponse(TransferRequest transferRequest) {
        return mapTransferRequestResponse(
                transferRequest,
                findPrimaryCourseByRequestId(List.of(transferRequest)),
                findDivisionNamesByStudentId(List.of(transferRequest))
        );
    }

    private TransferRequestResponse mapTransferRequestResponse(
            TransferRequest transferRequest,
            Map<Long, TransferRequestCourse> primaryCourseByRequestId,
            Map<Long, List<String>> divisionNamesByStudentId
    ) {
        Student student = transferRequest.getStudent();
        TransferCreditPolicy policy = transferRequest.getPolicy();
        SisUser decidedByUser = transferRequest.getDecidedByUser();

        return new TransferRequestResponse(
                transferRequest.getId(),
                student.getId(),
                student.getAltId(),
                student.getFirstName() + " " + student.getLastName(),
                student.getEmail(),
                student.getEstimatedGradDate() == null ? null : student.getEstimatedGradDate().getYear(),
                divisionNamesByStudentId.getOrDefault(student.getId(), List.of()),
                policy.getId(),
                mapInstitutionResponse(transferRequest),
                mapCourseResponse(primaryCourseByRequestId.get(transferRequest.getId())),
                transferRequest.getStatus(),
                transferRequest.getSubmittedAt(),
                decidedByUser == null ? null : decidedByUser.getId(),
                decidedByUser == null ? null : decidedByUser.getEmail(),
                transferRequest.getDecidedAt(),
                transferRequest.getDecisionNotes(),
                transferRequest.getCreatedAt(),
                transferRequest.getUpdatedAt()
        );
    }

    private Map<Long, TransferRequestCourse> findPrimaryCourseByRequestId(List<TransferRequest> transferRequests) {
        List<Long> transferRequestIds = transferRequests.stream()
                .map(TransferRequest::getId)
                .toList();

        if (transferRequestIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, TransferRequestCourse> primaryCourseByRequestId = new LinkedHashMap<>();
        transferRequestCourseRepository
                .findByTransferRequestIds(transferRequestIds)
                .forEach(course -> primaryCourseByRequestId.putIfAbsent(course.getTransferRequest().getId(), course));
        return primaryCourseByRequestId;
    }

    private Map<Long, List<TransferRequestCourse>> findCoursesByRequestId(List<TransferRequest> transferRequests) {
        List<Long> transferRequestIds = transferRequests.stream()
                .map(TransferRequest::getId)
                .toList();

        if (transferRequestIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<TransferRequestCourse>> coursesByRequestId = new LinkedHashMap<>();
        transferRequestCourseRepository.findByTransferRequestIds(transferRequestIds)
                .forEach(course -> coursesByRequestId
                        .computeIfAbsent(course.getTransferRequest().getId(), ignored -> new ArrayList<>())
                        .add(course));
        return coursesByRequestId;
    }

    private Map<Long, List<TransferRequestOutcome>> findOutcomesByCourseId(
            Map<Long, List<TransferRequestCourse>> coursesByRequestId
    ) {
        List<Long> courseIds = coursesByRequestId.values()
                .stream()
                .flatMap(List::stream)
                .map(TransferRequestCourse::getId)
                .toList();

        if (courseIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<TransferRequestOutcome>> outcomesByCourseId = new LinkedHashMap<>();
        transferRequestOutcomeRepository
                .findByTransferRequestCourseIdInOrderByTransferRequestCourseIdAscIdAsc(courseIds)
                .forEach(outcome -> outcomesByCourseId
                        .computeIfAbsent(outcome.getTransferRequestCourse().getId(), ignored -> new ArrayList<>())
                        .add(outcome));
        return outcomesByCourseId;
    }

    private Map<Long, List<String>> findDivisionNamesByStudentId(List<TransferRequest> transferRequests) {
        List<Long> studentIds = transferRequests.stream()
                .map(transferRequest -> transferRequest.getStudent().getId())
                .distinct()
                .toList();

        if (studentIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<String>> divisionNamesByStudentId = new LinkedHashMap<>();
        studentAcademicCareerRepository.findActiveCareerAcademicDivisionsByStudentIds(studentIds)
                .forEach(projection -> {
                    AcademicDivision academicDivision = projection.getAcademicDivision();
                    divisionNamesByStudentId
                            .computeIfAbsent(projection.getStudentId(), ignored -> new ArrayList<>())
                            .add(academicDivision.getName());
                });
        return divisionNamesByStudentId;
    }

    private com.msm.sis.api.dto.transfer.TransferRequestCourseResponse mapCourseResponse(
            TransferRequestCourse transferRequestCourse
    ) {
        if (transferRequestCourse == null) {
            return null;
        }

        return new com.msm.sis.api.dto.transfer.TransferRequestCourseResponse(
                transferRequestCourse.getId(),
                transferRequestCourse.getTransferRequest().getId(),
                transferRequestCourse.getExternalSubjectCode(),
                transferRequestCourse.getExternalCourseNumber(),
                transferRequestCourse.getExternalCourseTitle(),
                transferRequestCourse.getExternalCourseDescription(),
                transferRequestCourse.getExternalTerm(),
                transferRequestCourse.getRequestedCredits(),
                transferRequestCourse.getAttemptedCredits(),
                transferRequestCourse.getEarnedCredits(),
                transferRequestCourse.getGrade(),
                transferRequestCourse.getReason(),
                transferRequestCourse.getStudentNotes(),
                transferRequestCourse.getRequestedLocalCourseEquivalent(),
                transferRequestCourse.getSortOrder(),
                transferRequestCourse.getCreatedAt(),
                transferRequestCourse.getUpdatedAt()
        );
    }

    private StudentApprovedTransferRequestResponse mapStudentApprovedTransferRequestResponse(
            TransferRequest transferRequest,
            Map<Long, List<TransferRequestCourse>> coursesByRequestId,
            Map<Long, List<TransferRequestOutcome>> outcomesByCourseId
    ) {
        return new StudentApprovedTransferRequestResponse(
                transferRequest.getId(),
                resolveInstitutionName(transferRequest),
                transferRequest.getInstitutionLevel(),
                transferRequest.getSubmittedAt(),
                transferRequest.getDecidedAt(),
                coursesByRequestId.getOrDefault(transferRequest.getId(), List.of())
                        .stream()
                        .map(course -> mapStudentApprovedTransferRequestCourseResponse(course, outcomesByCourseId))
                        .toList()
        );
    }

    private StudentApprovedTransferRequestCourseResponse mapStudentApprovedTransferRequestCourseResponse(
            TransferRequestCourse course,
            Map<Long, List<TransferRequestOutcome>> outcomesByCourseId
    ) {
        return new StudentApprovedTransferRequestCourseResponse(
                course.getId(),
                course.getExternalSubjectCode(),
                course.getExternalCourseNumber(),
                course.getExternalCourseTitle(),
                course.getExternalCourseDescription(),
                course.getExternalTerm(),
                course.getRequestedCredits(),
                course.getAttemptedCredits(),
                course.getEarnedCredits(),
                course.getGrade(),
                course.getReason(),
                outcomesByCourseId.getOrDefault(course.getId(), List.of())
                        .stream()
                        .map(this::mapStudentApprovedTransferRequestOutcomeResponse)
                        .toList()
        );
    }

    private StudentApprovedTransferRequestOutcomeResponse mapStudentApprovedTransferRequestOutcomeResponse(
            TransferRequestOutcome outcome
    ) {
        com.msm.sis.api.entity.Course localCourse = outcome.getLocalCourse();
        com.msm.sis.api.entity.Requirement effectiveRequirement = outcome.getRequirement() == null
                && outcome.getProgramVersionRequirement() != null
                ? outcome.getProgramVersionRequirement().getRequirement()
                : outcome.getRequirement();

        return new StudentApprovedTransferRequestOutcomeResponse(
                outcome.getId(),
                outcome.getOutcomeType(),
                localCourse == null ? null : localCourse.getId(),
                localCourse == null ? null : localCourse.getSubject().getCode() + " " + localCourse.getCourseNumber(),
                effectiveRequirement == null ? null : effectiveRequirement.getId(),
                effectiveRequirement == null ? null : effectiveRequirement.getCode(),
                effectiveRequirement == null ? null : effectiveRequirement.getName(),
                outcome.getProgramVersionRequirement() == null ? null : outcome.getProgramVersionRequirement().getId(),
                outcome.getAcceptedCredits()
        );
    }

    private String resolveInstitutionName(TransferRequest transferRequest) {
        TransferInstitution transferInstitution = transferRequest.getTransferInstitution();
        if (transferInstitution != null) {
            return transferInstitution.getName();
        }

        return transferRequest.getOneOffInstitutionName();
    }

    private TransferRequestInstitutionResponse mapInstitutionResponse(TransferRequest transferRequest) {
        TransferInstitution transferInstitution = transferRequest.getTransferInstitution();
        SisUser institutionMatchedByUser = transferRequest.getInstitutionMatchedByUser();

        return new TransferRequestInstitutionResponse(
                transferInstitution == null ? null : transferInstitution.getId(),
                transferInstitution == null ? null : transferInstitution.getName(),
                transferInstitution == null ? null : transferInstitution.getAddressLine1(),
                transferInstitution == null ? null : transferInstitution.getAddressLine2(),
                transferInstitution == null ? null : transferInstitution.getCity(),
                transferInstitution == null ? null : transferInstitution.getStateRegion(),
                transferInstitution == null ? null : transferInstitution.getPostalCode(),
                transferInstitution == null ? null : transferInstitution.getCountryCode(),
                transferInstitution == null ? null : transferInstitution.getWebsite(),
                institutionMatchedByUser == null ? null : institutionMatchedByUser.getId(),
                institutionMatchedByUser == null ? null : institutionMatchedByUser.getEmail(),
                transferRequest.getInstitutionMatchedAt(),
                transferRequest.getOneOffInstitutionName(),
                transferRequest.getOneOffInstitutionAddressLine1(),
                transferRequest.getOneOffInstitutionAddressLine2(),
                transferRequest.getOneOffInstitutionCity(),
                transferRequest.getOneOffInstitutionStateRegion(),
                transferRequest.getOneOffInstitutionPostalCode(),
                transferRequest.getOneOffInstitutionCountryCode(),
                transferRequest.getOneOffInstitutionWebsite(),
                transferRequest.getInstitutionLevel()
        );
    }

    private TransferInstitutionOptionResponse mapTransferInstitutionOptionResponse(
            TransferInstitution transferInstitution
    ) {
        return new TransferInstitutionOptionResponse(
                transferInstitution.getId(),
                transferInstitution.getCode(),
                transferInstitution.getName(),
                transferInstitution.getInstitutionLevel(),
                transferInstitution.getAddressLine1(),
                transferInstitution.getAddressLine2(),
                transferInstitution.getCity(),
                transferInstitution.getStateRegion(),
                transferInstitution.getPostalCode(),
                transferInstitution.getCountryCode(),
                transferInstitution.getWebsite()
        );
    }
}
