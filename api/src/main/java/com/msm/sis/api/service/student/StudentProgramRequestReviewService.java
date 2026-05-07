package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.program.StudentProgramsResponse;
import com.msm.sis.api.dto.student.program.request.ProgramRequestReviewActionRequest;
import com.msm.sis.api.dto.student.program.request.ProgramRequestDepartmentScopeResponse;
import com.msm.sis.api.dto.student.program.request.ProgramRequestProgramVersionOptionResponse;
import com.msm.sis.api.dto.student.program.request.ProgramRequestQueuePageResponse;
import com.msm.sis.api.dto.student.program.request.ProgramRequestQueueSummaryResponse;
import com.msm.sis.api.dto.student.program.request.ProgramRequestQueueCriteria;
import com.msm.sis.api.dto.student.program.request.StudentProgramRequestDetailResponse;
import com.msm.sis.api.dto.student.program.request.StudentProgramRequestQueueResponse;
import com.msm.sis.api.dto.student.program.request.StudentProgramRequestSummaryResponse;
import com.msm.sis.api.dto.student.program.request.StudentProgramReviewDetailResponse;
import com.msm.sis.api.dto.student.program.request.StudentProgramReviewSummaryResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.entity.ClassStanding;
import com.msm.sis.api.entity.DegreeType;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.entity.StudentProgramRequest;
import com.msm.sis.api.repository.AcademicDepartmentStaffRoleRepository;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StaffRepository;
import com.msm.sis.api.repository.ProgramVersionRepository;
import com.msm.sis.api.repository.StudentProgramRequestRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentProgramRequestReviewService {
    private static final String STATUS_REQUESTED = "REQUESTED";
    private static final String STATUS_DEPARTMENT_APPROVED = "DEPARTMENT_APPROVED";
    private static final String STATUS_ADMIN_APPROVED = "ADMIN_APPROVED";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String DEPARTMENT_HEAD_ROLE_CODE = "DEPARTMENT_HEAD";
    private static final int MAX_QUEUE_PAGE_SIZE = 100;

    private static final List<String> DEFAULT_QUEUE_STATUSES = List.of(
            STATUS_REQUESTED,
            STATUS_DEPARTMENT_APPROVED
    );

    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicDepartmentStaffRoleRepository academicDepartmentStaffRoleRepository;
    private final SisUserRepository sisUserRepository;
    private final StaffRepository staffRepository;
    private final ProgramVersionRepository programVersionRepository;
    private final StudentProgramRequestRepository studentProgramRequestRepository;
    private final StudentProgramRepository studentProgramRepository;
    private final StudentProgramTrackerService studentProgramTrackerService;

    @Transactional(readOnly = true)
    public StudentProgramRequestQueueResponse getProgramRequestQueue(
            Long departmentId,
            List<String> statuses,
            String studentQuery,
            String programQuery,
            Long programTypeId,
            Long degreeTypeId,
            Long schoolId,
            Long classStandingId,
            LocalDate requestedFrom,
            LocalDate requestedTo,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        ProgramRequestQueueCriteria criteria = buildCriteria(
                statuses,
                studentQuery,
                programQuery,
                programTypeId,
                degreeTypeId,
                schoolId,
                departmentId,
                classStandingId,
                requestedFrom,
                requestedTo
        );
        validatePageRequest(page, size, MAX_QUEUE_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(page, size, buildQueueSort(sortBy, sortDirection));
        Page<StudentProgramRequest> requestsPage = studentProgramRequestRepository.findProgramRequests(
                criteria.statuses(),
                criteria.studentQuery(),
                criteria.programQuery(),
                criteria.programTypeId(),
                criteria.degreeTypeId(),
                criteria.schoolId(),
                criteria.departmentId(),
                criteria.classStandingId(),
                criteria.requestedFrom(),
                criteria.requestedBefore(),
                pageRequest
        );

        return buildQueueResponse(
                resolveProgramRequestDepartments(criteria),
                buildQueueSummary(criteria),
                requestsPage
        );
    }

    @Transactional(readOnly = true)
    public StudentProgramRequestQueueResponse getDepartmentHeadProgramRequestQueue(
            Long userId,
            List<String> statuses,
            String studentQuery,
            String programQuery,
            Long programTypeId,
            Long degreeTypeId,
            Long schoolId,
            Long classStandingId,
            LocalDate requestedFrom,
            LocalDate requestedTo,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        requirePositiveId(userId, "User id");
        ProgramRequestQueueCriteria criteria = buildCriteria(
                statuses,
                studentQuery,
                programQuery,
                programTypeId,
                degreeTypeId,
                schoolId,
                null,
                classStandingId,
                requestedFrom,
                requestedTo
        );
        validatePageRequest(page, size, MAX_QUEUE_PAGE_SIZE);
        List<AcademicDepartment> departments = academicDepartmentStaffRoleRepository.findActiveDepartmentsForUserAndRole(
                userId,
                DEPARTMENT_HEAD_ROLE_CODE,
                LocalDate.now()
        );
        List<Long> departmentIds = departments.stream()
                .map(AcademicDepartment::getId)
                .toList();

        if (departmentIds.isEmpty()) {
            return buildEmptyQueueResponse(page, size);
        }

        PageRequest pageRequest = PageRequest.of(page, size, buildQueueSort(sortBy, sortDirection));
        Page<StudentProgramRequest> requestsPage = studentProgramRequestRepository.findProgramRequestsForDepartments(
                criteria.statuses(),
                departmentIds,
                criteria.studentQuery(),
                criteria.programQuery(),
                criteria.programTypeId(),
                criteria.degreeTypeId(),
                criteria.schoolId(),
                criteria.departmentId(),
                criteria.classStandingId(),
                criteria.requestedFrom(),
                criteria.requestedBefore(),
                pageRequest
        );

        return buildQueueResponse(
                filterDepartmentScope(departments, criteria),
                buildDepartmentScopedQueueSummary(criteria, departmentIds),
                requestsPage
        );
    }

    @Transactional(readOnly = true)
    public StudentProgramRequestDetailResponse getProgramRequestDetail(Long studentProgramRequestId) {
        StudentProgramRequest studentProgramRequest = resolveStudentProgramRequestRecord(studentProgramRequestId);
        Student student = studentProgramRequest.getStudent();

        if (student == null || student.getId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found.");
        }

        StudentProgramsResponse plan = studentProgramTrackerService.getProgramsForStudentReadOnly(student.getId());
        return new StudentProgramRequestDetailResponse(
                toSummaryResponse(studentProgramRequest),
                programVersionOptionsFor(studentProgramRequest),
                plan
        );
    }

    @Transactional(readOnly = true)
    public StudentProgramReviewDetailResponse getStudentProgramReviewDetail(
            Long studentProgramId,
            Long reviewerUserId,
            List<String> roles
    ) {
        StudentProgram studentProgram = studentProgramRepository.findReviewDetailById(
                        requirePositiveId(studentProgramId, "Student program id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student program was not found."));
        validateCanViewStudentProgramReview(studentProgram, reviewerUserId, roles);

        Student student = studentProgram.getStudent();
        if (student == null || student.getId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found.");
        }

        StudentProgramRequest latestRequest = studentProgramRequestRepository
                .findRequestsForStudentProgram(studentProgram.getId())
                .stream()
                .findFirst()
                .orElse(null);
        StudentProgramsResponse plan = studentProgramTrackerService.getProgramsForStudentReadOnly(student.getId());

        return new StudentProgramReviewDetailResponse(
                toStudentProgramReviewSummaryResponse(studentProgram),
                latestRequest == null ? null : toSummaryResponse(latestRequest),
                programVersionOptionsFor(studentProgram.getProgram()),
                plan
        );
    }

    @Transactional
    public StudentProgramRequestDetailResponse approveDepartmentReview(
            Long studentProgramRequestId,
            ProgramRequestReviewActionRequest request,
            Long reviewerUserId
    ) {
        StudentProgramRequest studentProgramRequest = resolveStudentProgramRequestRecord(studentProgramRequestId);
        requireStatus(studentProgramRequest, STATUS_REQUESTED, "Only requested programs can be department approved.");
        SisUser reviewer = resolveUser(reviewerUserId);
        validateDepartmentHeadCanReview(studentProgramRequest, reviewerUserId);
        ReviewSignature signature = resolveReviewSignature(reviewer);
        ProgramVersion selectedProgramVersion = resolveSelectedProgramVersion(studentProgramRequest, request);

        studentProgramRequest.setDepartmentApprovedProgramVersion(selectedProgramVersion);
        studentProgramRequest.setStatus(STATUS_DEPARTMENT_APPROVED);
        studentProgramRequest.setDepartmentReviewedAt(LocalDateTime.now());
        studentProgramRequest.setDepartmentReviewedByUser(reviewer);
        studentProgramRequest.setDepartmentSignatureName(signature.name());
        studentProgramRequest.setDepartmentSignatureEmail(signature.email());
        studentProgramRequest.setDepartmentComment(trimToNull(request == null ? null : request.comment()));
        studentProgramRequest.setUpdatedByUser(reviewer);
        studentProgramRequestRepository.saveAndFlush(studentProgramRequest);

        return getProgramRequestDetail(studentProgramRequest.getId());
    }

    @Transactional
    public StudentProgramRequestDetailResponse approveAdminReview(
            Long studentProgramRequestId,
            ProgramRequestReviewActionRequest request,
            Long reviewerUserId
    ) {
        StudentProgramRequest studentProgramRequest = resolveStudentProgramRequestRecord(studentProgramRequestId);
        if (!STATUS_DEPARTMENT_APPROVED.equalsIgnoreCase(studentProgramRequest.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only department-approved programs can be admin approved."
            );
        }
        SisUser reviewer = resolveUser(reviewerUserId);
        ReviewSignature signature = resolveReviewSignature(reviewer);
        ProgramVersion approvedProgramVersion = resolveAdminApprovedProgramVersion(studentProgramRequest, request);
        StudentProgram studentProgram = resolveStudentProgramForAdminApproval(studentProgramRequest);

        studentProgram.setStudent(studentProgramRequest.getStudent());
        studentProgram.setProgramVersion(approvedProgramVersion);
        studentProgram.setStatus(STATUS_ACTIVE);
        studentProgram.setDeclaredDate(LocalDate.now());
        studentProgram.setCompletedDate(null);
        studentProgram.setUpdatedByUser(reviewer);
        studentProgramRepository.saveAndFlush(studentProgram);

        studentProgramRequest.setStudentProgram(studentProgram);
        studentProgramRequest.setDepartmentApprovedProgramVersion(approvedProgramVersion);
        studentProgramRequest.setStatus(STATUS_ADMIN_APPROVED);
        studentProgramRequest.setAdminReviewedAt(LocalDateTime.now());
        studentProgramRequest.setAdminReviewedByUser(reviewer);
        studentProgramRequest.setAdminSignatureName(signature.name());
        studentProgramRequest.setAdminSignatureEmail(signature.email());
        studentProgramRequest.setAdminComment(trimToNull(request == null ? null : request.comment()));
        studentProgramRequest.setUpdatedByUser(reviewer);
        studentProgramRequestRepository.saveAndFlush(studentProgramRequest);

        return getProgramRequestDetail(studentProgramRequest.getId());
    }

    private ProgramVersion resolveAdminApprovedProgramVersion(
            StudentProgramRequest studentProgramRequest,
            ProgramRequestReviewActionRequest request
    ) {
        if (request != null && request.programVersionId() != null) {
            return resolveSelectedProgramVersion(studentProgramRequest, request);
        }

        ProgramVersion approvedProgramVersion = studentProgramRequest.getDepartmentApprovedProgramVersion();
        if (approvedProgramVersion != null) {
            return approvedProgramVersion;
        }

        approvedProgramVersion = studentProgramRequest.getRequestedProgramVersion();
        if (approvedProgramVersion == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested program has no program version.");
        }

        return approvedProgramVersion;
    }

    private StudentProgram resolveStudentProgramForAdminApproval(StudentProgramRequest studentProgramRequest) {
        Student student = studentProgramRequest.getStudent();
        Program program = studentProgramRequest.getProgram();
        if (student == null || student.getId() == null || program == null || program.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program request is missing student or program details.");
        }

        StudentProgram linkedStudentProgram = studentProgramRequest.getStudentProgram();
        if (linkedStudentProgram != null) {
            if (linkedStudentProgram.getStudent() == null
                    || !student.getId().equals(linkedStudentProgram.getStudent().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Linked student program belongs to a different student.");
            }

            return linkedStudentProgram;
        }

        return studentProgramRepository.findCurrentForStudentAndProgram(student.getId(), program.getId()).stream()
                .findFirst()
                .orElseGet(StudentProgram::new);
    }

    @Transactional
    public StudentProgramRequestDetailResponse rejectProgramRequest(
            Long studentProgramRequestId,
            ProgramRequestReviewActionRequest request,
            Long reviewerUserId,
            List<String> roles
    ) {
        StudentProgramRequest studentProgramRequest = resolveStudentProgramRequestRecord(studentProgramRequestId);
        if (!STATUS_REQUESTED.equalsIgnoreCase(studentProgramRequest.getStatus())
                && !STATUS_DEPARTMENT_APPROVED.equalsIgnoreCase(studentProgramRequest.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only requested or department-approved programs can be rejected."
            );
        }

        String comment = trimToNull(request == null ? null : request.comment());
        if (comment == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection comment is required.");
        }
        SisUser reviewer = resolveUser(reviewerUserId);
        ReviewSignature signature = resolveReviewSignature(reviewer);
        boolean adminReviewer = hasRole(roles, "ADMIN");

        if (!adminReviewer) {
            validateDepartmentHeadCanReview(studentProgramRequest, reviewerUserId);
        }

        studentProgramRequest.setStatus(STATUS_REJECTED);
        if (adminReviewer) {
            studentProgramRequest.setAdminReviewedAt(LocalDateTime.now());
            studentProgramRequest.setAdminReviewedByUser(reviewer);
            studentProgramRequest.setAdminSignatureName(signature.name());
            studentProgramRequest.setAdminSignatureEmail(signature.email());
            studentProgramRequest.setAdminComment(comment);
        } else {
            studentProgramRequest.setDepartmentReviewedAt(LocalDateTime.now());
            studentProgramRequest.setDepartmentReviewedByUser(reviewer);
            studentProgramRequest.setDepartmentSignatureName(signature.name());
            studentProgramRequest.setDepartmentSignatureEmail(signature.email());
            studentProgramRequest.setDepartmentComment(comment);
        }
        studentProgramRequest.setUpdatedByUser(reviewer);
        studentProgramRequestRepository.saveAndFlush(studentProgramRequest);

        return getProgramRequestDetail(studentProgramRequest.getId());
    }

    private boolean hasRole(List<String> roles, String expectedRole) {
        return roles != null && roles.stream().anyMatch(role -> expectedRole.equalsIgnoreCase(role));
    }

    private List<String> normalizeStatuses(List<String> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return DEFAULT_QUEUE_STATUSES;
        }

        List<String> normalizedStatuses = statuses.stream()
                .map(status -> status == null ? null : trimToNull(status.toUpperCase()))
                .filter(status -> status != null && !status.isEmpty())
                .distinct()
                .toList();

        return normalizedStatuses.isEmpty() ? DEFAULT_QUEUE_STATUSES : normalizedStatuses;
    }

    private ProgramRequestQueueCriteria buildCriteria(
            List<String> statuses,
            String studentQuery,
            String programQuery,
            Long programTypeId,
            Long degreeTypeId,
            Long schoolId,
            Long departmentId,
            Long classStandingId,
            LocalDate requestedFrom,
            LocalDate requestedTo
    ) {
        LocalDateTime requestedFromDateTime = requestedFrom == null ? null : requestedFrom.atStartOfDay();
        LocalDateTime requestedBeforeDateTime = requestedTo == null ? null : requestedTo.plusDays(1).atStartOfDay();

        if (requestedFrom != null && requestedTo != null && requestedFrom.isAfter(requestedTo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested from date must be on or before requested to date.");
        }

        return new ProgramRequestQueueCriteria(
                normalizeStatuses(statuses),
                normalizeSearchQuery(studentQuery),
                normalizeSearchQuery(programQuery),
                programTypeId == null ? null : requirePositiveId(programTypeId, "Program type id"),
                degreeTypeId == null ? null : requirePositiveId(degreeTypeId, "Degree type id"),
                schoolId == null ? null : requirePositiveId(schoolId, "School id"),
                departmentId == null ? null : requirePositiveId(departmentId, "Department id"),
                classStandingId == null ? null : requirePositiveId(classStandingId, "Class standing id"),
                requestedFromDateTime,
                requestedBeforeDateTime
        );
    }

    private String normalizeSearchQuery(String value) {
        String normalizedValue = trimToNull(value);

        return normalizedValue == null ? null : "%" + normalizedValue.toLowerCase() + "%";
    }

    private StudentProgramRequestQueueResponse buildQueueResponse(
            List<AcademicDepartment> departments,
            ProgramRequestQueueSummaryResponse summary,
            Page<StudentProgramRequest> requestsPage
    ) {
        return new StudentProgramRequestQueueResponse(
                departments.stream()
                        .map(this::toDepartmentScopeResponse)
                        .toList(),
                summary,
                new ProgramRequestQueuePageResponse(
                        requestsPage.getNumber(),
                        requestsPage.getSize(),
                        requestsPage.getTotalElements(),
                        requestsPage.getTotalPages()
                ),
                requestsPage.getContent().stream()
                        .map(this::toSummaryResponse)
                        .toList()
        );
    }

    private StudentProgramRequestQueueResponse buildEmptyQueueResponse(int page, int size) {
        return new StudentProgramRequestQueueResponse(
                List.of(),
                new ProgramRequestQueueSummaryResponse(0, 0, 0),
                new ProgramRequestQueuePageResponse(page, size, 0, 0),
                List.of()
        );
    }

    private List<AcademicDepartment> resolveProgramRequestDepartments(ProgramRequestQueueCriteria criteria) {
        if (criteria.departmentId() == null) {
            return studentProgramRequestRepository.findProgramRequestDepartments(criteria.statuses(), null);
        }

        return academicDepartmentRepository.findById(criteria.departmentId())
                .map(List::of)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department was not found."));
    }

    private ProgramRequestQueueSummaryResponse buildQueueSummary(ProgramRequestQueueCriteria criteria) {
        return new ProgramRequestQueueSummaryResponse(
                studentProgramRequestRepository.countProgramRequests(
                        criteria.statuses(),
                        criteria.studentQuery(),
                        criteria.programQuery(),
                        criteria.programTypeId(),
                        criteria.degreeTypeId(),
                        criteria.schoolId(),
                        criteria.departmentId(),
                        criteria.classStandingId(),
                        criteria.requestedFrom(),
                        criteria.requestedBefore()
                ),
                countIfIncluded(criteria, STATUS_REQUESTED),
                countIfIncluded(criteria, STATUS_DEPARTMENT_APPROVED)
        );
    }

    private ProgramRequestQueueSummaryResponse buildDepartmentScopedQueueSummary(
            ProgramRequestQueueCriteria criteria,
            List<Long> departmentIds
    ) {
        return new ProgramRequestQueueSummaryResponse(
                studentProgramRequestRepository.countProgramRequestsForDepartments(
                        criteria.statuses(),
                        departmentIds,
                        criteria.studentQuery(),
                        criteria.programQuery(),
                        criteria.programTypeId(),
                        criteria.degreeTypeId(),
                        criteria.schoolId(),
                        criteria.departmentId(),
                        criteria.classStandingId(),
                        criteria.requestedFrom(),
                        criteria.requestedBefore()
                ),
                countForDepartmentsIfIncluded(criteria, STATUS_REQUESTED, departmentIds),
                countForDepartmentsIfIncluded(criteria, STATUS_DEPARTMENT_APPROVED, departmentIds)
        );
    }

    private long countIfIncluded(ProgramRequestQueueCriteria criteria, String status) {
        if (!criteria.statuses().contains(status)) {
            return 0;
        }

        return studentProgramRequestRepository.countProgramRequestsByStatus(
                status,
                criteria.studentQuery(),
                criteria.programQuery(),
                criteria.programTypeId(),
                criteria.degreeTypeId(),
                criteria.schoolId(),
                criteria.departmentId(),
                criteria.classStandingId(),
                criteria.requestedFrom(),
                criteria.requestedBefore()
        );
    }

    private long countForDepartmentsIfIncluded(
            ProgramRequestQueueCriteria criteria,
            String status,
            List<Long> departmentIds
    ) {
        if (!criteria.statuses().contains(status)) {
            return 0;
        }

        return studentProgramRequestRepository.countProgramRequestsForDepartmentsByStatus(
                status,
                departmentIds,
                criteria.studentQuery(),
                criteria.programQuery(),
                criteria.programTypeId(),
                criteria.degreeTypeId(),
                criteria.schoolId(),
                criteria.departmentId(),
                criteria.classStandingId(),
                criteria.requestedFrom(),
                criteria.requestedBefore()
        );
    }

    private List<AcademicDepartment> filterDepartmentScope(
            List<AcademicDepartment> departments,
            ProgramRequestQueueCriteria criteria
    ) {
        return departments.stream()
                .filter(department -> criteria.departmentId() == null || criteria.departmentId().equals(department.getId()))
                .filter(department -> criteria.schoolId() == null
                        || (department.getSchool() != null && criteria.schoolId().equals(department.getSchool().getId())))
                .toList();
    }

    private Sort buildQueueSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String normalizedSortBy = trimToNull(sortBy);

        if ("classStanding".equalsIgnoreCase(normalizedSortBy)) {
            return Sort.by(direction, "student.classStanding.name")
                    .and(Sort.by(direction, "student.lastName"))
                    .and(Sort.by("id").ascending());
        }

        if ("department".equalsIgnoreCase(normalizedSortBy)) {
            return Sort.by(direction, "program.department.name")
                    .and(Sort.by(direction, "program.name"))
                    .and(Sort.by("id").ascending());
        }

        if ("program".equalsIgnoreCase(normalizedSortBy)) {
            return Sort.by(direction, "program.name")
                    .and(Sort.by("id").ascending());
        }

        if ("status".equalsIgnoreCase(normalizedSortBy)) {
            return Sort.by(direction, "status")
                    .and(Sort.by(Sort.Direction.ASC, "requestedAt"))
                    .and(Sort.by("id").ascending());
        }

        if ("student".equalsIgnoreCase(normalizedSortBy)) {
            return Sort.by(direction, "student.lastName")
                    .and(Sort.by(direction, "student.firstName"))
                    .and(Sort.by(direction, "student.email"))
                    .and(Sort.by("id").ascending());
        }

        if (normalizedSortBy != null && !"requestedAt".equalsIgnoreCase(normalizedSortBy)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be requestedAt, student, program, department, classStanding, or status."
            );
        }

        return Sort.by(direction, "requestedAt")
                .and(Sort.by(direction, "updatedAt"))
                .and(Sort.by("id").ascending());
    }

    private StudentProgramRequest resolveStudentProgramRequestRecord(Long studentProgramRequestId) {
        requirePositiveId(studentProgramRequestId, "Student program request id");
        return studentProgramRequestRepository.findRequestById(studentProgramRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program request was not found."));
    }

    private SisUser resolveUser(Long userId) {
        requirePositiveId(userId, "User id");
        return sisUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reviewer was not found."));
    }

    private void requireStatus(StudentProgramRequest studentProgramRequest, String status, String message) {
        if (!status.equalsIgnoreCase(studentProgramRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void validateDepartmentHeadCanReview(StudentProgramRequest studentProgramRequest, Long reviewerUserId) {
        AcademicDepartment department = requestedProgramDepartment(studentProgramRequest);
        if (department == null || department.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested program does not belong to a department."
            );
        }

        boolean canReview = academicDepartmentStaffRoleRepository.existsActiveRoleForUserAndDepartment(
                reviewerUserId,
                department.getId(),
                DEPARTMENT_HEAD_ROLE_CODE,
                LocalDate.now()
        );

        if (!canReview) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User is not an active department head for this program's department."
            );
        }
    }

    private void validateCanViewStudentProgramReview(
            StudentProgram studentProgram,
            Long reviewerUserId,
            List<String> roles
    ) {
        if (roles != null && roles.contains("ADMIN")) {
            return;
        }

        validateDepartmentHeadCanAccessProgram(studentProgram.getProgram(), reviewerUserId);
    }

    private void validateDepartmentHeadCanAccessProgram(Program program, Long reviewerUserId) {
        requirePositiveId(reviewerUserId, "Reviewer user id");
        AcademicDepartment department = program == null ? null : program.getDepartment();
        if (department == null || department.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Program is not assigned to a department."
            );
        }

        boolean canAccess = academicDepartmentStaffRoleRepository.existsActiveRoleForUserAndDepartment(
                reviewerUserId,
                department.getId(),
                DEPARTMENT_HEAD_ROLE_CODE,
                LocalDate.now()
        );

        if (!canAccess) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User is not an active department head for this program's department."
            );
        }
    }

    private AcademicDepartment requestedProgramDepartment(StudentProgramRequest studentProgramRequest) {
        Program program = studentProgramRequest.getProgram();
        return program == null ? null : program.getDepartment();
    }

    private ProgramVersion resolveSelectedProgramVersion(
            StudentProgramRequest studentProgramRequest,
            ProgramRequestReviewActionRequest request
    ) {
        ProgramVersion requestedProgramVersion = studentProgramRequest.getRequestedProgramVersion();
        Program requestedProgram = studentProgramRequest.getProgram();
        if (requestedProgramVersion == null || requestedProgram == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested program has no program version.");
        }

        Long requestedProgramVersionId = request == null ? null : request.programVersionId();
        if (requestedProgramVersionId == null) {
            return requestedProgramVersion;
        }

        ProgramVersion selectedProgramVersion = programVersionRepository.findById(
                        requirePositiveId(requestedProgramVersionId, "Program version id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program version was not found."));

        Program selectedProgram = selectedProgramVersion.getProgram();
        if (selectedProgram == null
                || selectedProgram.getId() == null
                || !selectedProgram.getId().equals(requestedProgram.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected program version must belong to the requested program."
            );
        }
        if (!selectedProgramVersion.isPublished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected program version must be published.");
        }

        return selectedProgramVersion;
    }

    private List<ProgramRequestProgramVersionOptionResponse> programVersionOptionsFor(
            StudentProgramRequest studentProgramRequest
    ) {
        return programVersionOptionsFor(studentProgramRequest.getProgram());
    }

    private List<ProgramRequestProgramVersionOptionResponse> programVersionOptionsFor(Program program) {
        if (program == null || program.getId() == null) {
            return List.of();
        }

        return programVersionRepository.findPublishedVersionsForProgram(program.getId()).stream()
                .map(this::toProgramVersionOptionResponse)
                .toList();
    }

    private ProgramRequestProgramVersionOptionResponse toProgramVersionOptionResponse(
            ProgramVersion programVersion
    ) {
        return new ProgramRequestProgramVersionOptionResponse(
                programVersion.getId(),
                programVersion.getVersionNumber(),
                programVersion.getClassYearStart(),
                programVersion.getClassYearEnd(),
                programVersion.isPublished()
        );
    }

    private ReviewSignature resolveReviewSignature(SisUser reviewer) {
        if (reviewer == null || reviewer.getId() == null) {
            return new ReviewSignature(null, null);
        }

        return staffRepository.findByUserId(reviewer.getId())
                .map(staff -> new ReviewSignature(displayName(staff, reviewer), reviewer.getEmail()))
                .orElseGet(() -> new ReviewSignature(reviewer.getEmail(), reviewer.getEmail()));
    }

    private String displayName(Staff staff, SisUser reviewer) {
        String firstName = staff.getFirstName() == null ? "" : staff.getFirstName().trim();
        String lastName = staff.getLastName() == null ? "" : staff.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();

        return displayName.isBlank() ? reviewer.getEmail() : displayName;
    }

    private StudentProgramReviewSummaryResponse toStudentProgramReviewSummaryResponse(StudentProgram studentProgram) {
        Student student = studentProgram.getStudent();
        ClassStanding classStanding = student == null ? null : student.getClassStanding();
        ProgramVersion programVersion = studentProgram.getProgramVersion();
        Program program = studentProgram.getProgram();
        ProgramType programType = program == null ? null : program.getProgramType();
        DegreeType degreeType = program == null ? null : program.getDegreeType();
        AcademicSchool school = program == null ? null : program.getSchool();
        AcademicDepartment department = program == null ? null : program.getDepartment();

        return new StudentProgramReviewSummaryResponse(
                studentProgram.getId(),
                studentProgram.getStatus(),
                studentProgram.getDeclaredDate(),
                studentProgram.getCompletedDate(),
                student == null ? null : student.getId(),
                student == null ? null : student.getFirstName(),
                student == null ? null : student.getLastName(),
                student == null ? null : student.getPreferredName(),
                student == null ? null : student.getEmail(),
                classStanding == null ? null : classStanding.getName(),
                student == null ? null : student.getEstimatedGradDate(),
                program == null ? null : program.getId(),
                programVersion == null ? null : programVersion.getId(),
                programVersion == null ? null : programVersion.getVersionNumber(),
                programVersion == null ? null : programVersion.getClassYearStart(),
                programVersion == null ? null : programVersion.getClassYearEnd(),
                program == null ? null : program.getCode(),
                program == null ? null : program.getName(),
                programType == null ? null : programType.getCode(),
                programType == null ? null : programType.getName(),
                degreeType == null ? null : degreeType.getCode(),
                degreeType == null ? null : degreeType.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName()
        );
    }

    private StudentProgramRequestSummaryResponse toSummaryResponse(StudentProgramRequest studentProgramRequest) {
        Student student = studentProgramRequest.getStudent();
        ClassStanding classStanding = student == null ? null : student.getClassStanding();
        ProgramVersion programVersion = studentProgramRequest.getDepartmentApprovedProgramVersion() == null
                ? studentProgramRequest.getRequestedProgramVersion()
                : studentProgramRequest.getDepartmentApprovedProgramVersion();
        Program program = studentProgramRequest.getProgram();
        ProgramType programType = program == null ? null : program.getProgramType();
        DegreeType degreeType = program == null ? null : program.getDegreeType();
        AcademicSchool school = program == null ? null : program.getSchool();
        AcademicDepartment department = program == null ? null : program.getDepartment();
        SisUser departmentReviewer = studentProgramRequest.getDepartmentReviewedByUser();
        SisUser adminReviewer = studentProgramRequest.getAdminReviewedByUser();

        return new StudentProgramRequestSummaryResponse(
                studentProgramRequest.getId(),
                studentProgramRequest.getStatus(),
                studentProgramRequest.getRequestedAt(),
                student == null ? null : student.getId(),
                student == null ? null : student.getFirstName(),
                student == null ? null : student.getLastName(),
                student == null ? null : student.getPreferredName(),
                student == null ? null : student.getEmail(),
                classStanding == null ? null : classStanding.getName(),
                student == null ? null : student.getEstimatedGradDate(),
                program == null ? null : program.getId(),
                programVersion == null ? null : programVersion.getId(),
                programVersion == null ? null : programVersion.getVersionNumber(),
                programVersion == null ? null : programVersion.getClassYearStart(),
                programVersion == null ? null : programVersion.getClassYearEnd(),
                program == null ? null : program.getCode(),
                program == null ? null : program.getName(),
                programType == null ? null : programType.getCode(),
                programType == null ? null : programType.getName(),
                degreeType == null ? null : degreeType.getCode(),
                degreeType == null ? null : degreeType.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                studentProgramRequest.getDepartmentReviewedAt(),
                departmentReviewer == null ? null : departmentReviewer.getEmail(),
                studentProgramRequest.getDepartmentReviewedAt(),
                studentProgramRequest.getDepartmentSignatureName(),
                studentProgramRequest.getDepartmentSignatureEmail(),
                studentProgramRequest.getDepartmentComment(),
                studentProgramRequest.getAdminReviewedAt(),
                adminReviewer == null ? null : adminReviewer.getEmail(),
                studentProgramRequest.getAdminReviewedAt(),
                studentProgramRequest.getAdminSignatureName(),
                studentProgramRequest.getAdminSignatureEmail(),
                studentProgramRequest.getAdminComment()
        );
    }

    private ProgramRequestDepartmentScopeResponse toDepartmentScopeResponse(AcademicDepartment department) {
        AcademicSchool school = department == null ? null : department.getSchool();

        return new ProgramRequestDepartmentScopeResponse(
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName()
        );
    }

    private record ReviewSignature(String name, String email) {
    }
}
