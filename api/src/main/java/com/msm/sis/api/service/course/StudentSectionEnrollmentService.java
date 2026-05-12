package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.AddCourseSectionStudentRequest;
import com.msm.sis.api.dto.course.CourseSectionStudentEnrollmentEventResponse;
import com.msm.sis.api.dto.course.CourseSectionStudentEnrollmentEventListResponse;
import com.msm.sis.api.dto.course.CourseSectionStudentListResponse;
import com.msm.sis.api.dto.course.CourseSectionStudentResponse;
import com.msm.sis.api.dto.course.PatchCourseSectionStudentEnrollmentRequest;
import com.msm.sis.api.dto.course.PostCourseSectionStudentGradeRequest;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.GradeMark;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionGrade;
import com.msm.sis.api.entity.StudentSectionGradeType;
import com.msm.sis.api.entity.StudentSectionWaitlistOffer;
import com.msm.sis.api.mapper.StudentSectionEnrollmentMapper;
import com.msm.sis.api.repository.CourseSectionRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentSectionGradeRepository;
import com.msm.sis.api.repository.StudentSectionWaitlistOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requireGreaterThanZero;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class StudentSectionEnrollmentService {
    private static final String DEFAULT_EVENT_TYPE_ADDED = "ADDED";
    private static final String EVENT_TYPE_GRADE_POSTED = "GRADE_POSTED";
    private static final String EVENT_TYPE_GRADE_CHANGED = "GRADE_CHANGED";
    private static final Set<String> GRADEABLE_ENROLLMENT_STATUS_CODES = Set.of(
            "REGISTERED",
            "IN_PROGRESS",
            "COMPLETED"
    );
    private static final Set<String> GRADEABLE_SECTION_STATUS_CODES = Set.of(
            "IN_PROGRESS",
            "COMPLETED"
    );
    private static final Set<String> POSTABLE_GRADE_TYPE_CODES = Set.of(
            "MIDTERM",
            "FINAL"
    );

    private static final Map<String, String> SORT_FIELDS = Map.of(
            "student", "student.lastName",
            "status", "status.sortOrder",
            "registeredAt", "registeredAt",
            "waitlistPosition", "waitlistPosition",
            "creditsAttempted", "creditsAttempted"
    );

    private final CourseSectionRepository courseSectionRepository;
    private final StudentRepository studentRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;
    private final StudentSectionEnrollmentMapper studentSectionEnrollmentMapper;
    private final StudentSectionEnrollmentEventService enrollmentEventService;
    private final StudentSectionEnrollmentPatchService enrollmentPatchService;
    private final StudentSectionEnrollmentReferenceResolver referenceResolver;
    private final StudentSectionEnrollmentStatusService enrollmentStatusService;
    private final StudentSectionWaitlistActivationService waitlistActivationService;
    private final StudentSectionWaitlistExpirationService waitlistExpirationService;
    private final StudentSectionGradeRepository gradeRepository;
    private final StudentSectionWaitlistOfferRepository waitlistOfferRepository;

    @Transactional(readOnly = true)
    public CourseSectionStudentListResponse getSectionStudents(
            Long sectionId,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        validatePositiveId(sectionId, "Course section id");
        validatePageRequest(page, size, 100);

        Pageable pageable = PageRequest.of(page, size, buildSort(sortBy, sortDirection));
        Page<StudentSectionEnrollment> enrollmentsPage = enrollmentRepository.findPageBySectionId(
                sectionId,
                pageable
        );
        Map<Long, List<StudentSectionGrade>> currentGrades = findCurrentGrades(enrollmentsPage.getContent());
        Map<Long, StudentSectionWaitlistOffer> waitlistOffersByEnrollmentId =
                findLatestWaitlistOffers(enrollmentsPage.getContent());

        return new CourseSectionStudentListResponse(
                sectionId,
                enrollmentsPage.getContent().stream()
                        .map(enrollment -> studentSectionEnrollmentMapper.toStudentResponse(
                                enrollment,
                                currentGrades.get(enrollment.getId()),
                                waitlistOffersByEnrollmentId.get(enrollment.getId())
                        ))
                        .toList(),
                enrollmentsPage.getNumber(),
                enrollmentsPage.getSize(),
                enrollmentsPage.getTotalElements(),
                enrollmentsPage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public CourseSectionStudentResponse getSectionStudentEnrollment(
            Long sectionId,
            Long enrollmentId
    ) {
        validatePositiveId(sectionId, "Course section id");
        validatePositiveId(enrollmentId, "Enrollment id");

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return mapEnrollmentWithFreshGrades(enrollment);
    }

    @Transactional
    public CourseSectionStudentResponse addStudentToSection(
            Long sectionId,
            AddCourseSectionStudentRequest request,
            Long actorUserId
    ) {
        validatePositiveId(sectionId, "Course section id");
        requireRequestBody(request);
        validatePositiveId(request.studentId(), "Student id");

        CourseSection courseSection = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student id is invalid."));

        if (enrollmentRepository.existsBySectionIdAndStudentId(sectionId, request.studentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student is already assigned to this section.");
        }

        StudentSectionEnrollmentStatus status = referenceResolver.resolveEnrollmentStatus(
                enrollmentStatusService.determineStatusCode(courseSection, request)
        );
        GradingBasis gradingBasis = referenceResolver.resolveGradingBasis(Optional.ofNullable(trimToNull(request.gradingBasisCode()))
                .orElseGet(() -> courseSection.getGradingBasis().getCode()));
        SisUser actorUser = referenceResolver.resolveOptionalUser(actorUserId);

        StudentSectionEnrollment enrollment = new StudentSectionEnrollment();
        enrollment.setCourseSection(courseSection);
        enrollment.setStudent(student);
        enrollment.setStatus(status);
        enrollment.setGradingBasis(gradingBasis);
        enrollment.setEnrollmentDate(LocalDate.now());
        enrollment.setCreditsAttempted(Optional.ofNullable(request.creditsAttempted()).orElse(courseSection.getCredits()));
        enrollment.setIncludeInGpa(Optional.ofNullable(request.includeInGpa()).orElse(true));
        enrollment.setCapacityOverride(Optional.ofNullable(request.capacityOverride()).orElse(false));
        enrollment.setManualAddReason(trimToNull(request.manualAddReason()));
        enrollmentStatusService.applyStatusDates(enrollment, status, actorUser);
        enrollmentStatusService.applyWaitlistState(enrollment, status);

        StudentSectionEnrollment savedEnrollment = enrollmentRepository.saveAndFlush(enrollment);
        enrollmentEventService.createEvent(
                savedEnrollment,
                DEFAULT_EVENT_TYPE_ADDED,
                null,
                status,
                actorUser,
                request.manualAddReason()
        );

        return studentSectionEnrollmentMapper.toStudentResponse(savedEnrollment, List.of(), null);
    }

    @Transactional
    public CourseSectionStudentResponse patchEnrollment(
            Long sectionId,
            Long enrollmentId,
            PatchCourseSectionStudentEnrollmentRequest request,
            Long actorUserId
    ) {
        validatePositiveId(sectionId, "Course section id");
        validatePositiveId(enrollmentId, "Enrollment id");
        requireRequestBody(request);

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        SisUser actorUser = referenceResolver.resolveOptionalUser(actorUserId);
        StudentSectionEnrollmentStatus priorStatus = enrollment.getStatus();

        enrollmentPatchService.applyPatch(enrollment, request, actorUser);

        StudentSectionEnrollment savedEnrollment = enrollmentRepository.saveAndFlush(enrollment);
        if (request.getStatusCode().isPresent()) {
            enrollmentEventService.createEvent(
                    savedEnrollment,
                    enrollmentStatusService.statusChangeEventType(priorStatus, savedEnrollment.getStatus()),
                    priorStatus,
                    savedEnrollment.getStatus(),
                    actorUser,
                    request.getReason().orElse(null)
            );
            compactWaitlistIfEnrollmentLeftQueue(savedEnrollment, priorStatus);
            activateWaitlistIfSeatWasReleased(savedEnrollment, priorStatus);
        }

        return studentSectionEnrollmentMapper.toStudentResponse(
                savedEnrollment,
                savedEnrollment.getGrades(),
                findLatestWaitlistOffer(savedEnrollment.getId())
        );
    }

    @Transactional
    public CourseSectionStudentResponse expireWaitlistOfferNow(Long sectionId, Long enrollmentId) {
        validatePositiveId(sectionId, "Course section id");
        validatePositiveId(enrollmentId, "Enrollment id");

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        StudentSectionWaitlistOffer offer = waitlistOfferRepository
                .findByStudentSectionEnrollmentIdAndStatus(enrollmentId, "OFFERED")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Student does not have an active waitlist offer."
                ));

        offer.setExpiresAt(java.time.LocalDateTime.now());
        waitlistOfferRepository.saveAndFlush(offer);

        return mapEnrollmentWithFreshGrades(enrollment);
    }

    @Transactional
    public CourseSectionStudentResponse runExpiredWaitlistOfferCleanup(Long sectionId, Long enrollmentId) {
        validatePositiveId(sectionId, "Course section id");
        validatePositiveId(enrollmentId, "Enrollment id");

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        waitlistExpirationService.expireOverdueOffers();

        StudentSectionEnrollment refreshedEnrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElse(enrollment);
        return mapEnrollmentWithFreshGrades(refreshedEnrollment);
    }

    private void activateWaitlistIfSeatWasReleased(
            StudentSectionEnrollment enrollment,
            StudentSectionEnrollmentStatus priorStatus
    ) {
        if (!isSeatHoldingStatus(priorStatus) || !isSeatReleasingStatus(enrollment.getStatus())) {
            return;
        }

        CourseSection section = enrollment.getCourseSection();
        if (section == null || section.getId() == null || !section.isWaitlistAllowed()) {
            return;
        }

        waitlistActivationService.activateNextWaitlistedStudent(section.getId());
    }

    private void compactWaitlistIfEnrollmentLeftQueue(
            StudentSectionEnrollment enrollment,
            StudentSectionEnrollmentStatus priorStatus
    ) {
        if (!isWaitlistedStatus(priorStatus) || isWaitlistedStatus(enrollment.getStatus())) {
            return;
        }

        CourseSection section = enrollment.getCourseSection();
        if (section == null || section.getId() == null) {
            return;
        }

        enrollmentStatusService.compactWaitlistPositions(section.getId());
    }

    private boolean isSeatHoldingStatus(StudentSectionEnrollmentStatus status) {
        String code = status == null ? null : status.getCode();
        return "REGISTERED".equalsIgnoreCase(code) || "IN_PROGRESS".equalsIgnoreCase(code);
    }

    private boolean isSeatReleasingStatus(StudentSectionEnrollmentStatus status) {
        String code = status == null ? null : status.getCode();
        return "DROPPED".equalsIgnoreCase(code) || "WITHDRAWN".equalsIgnoreCase(code);
    }

    private boolean isWaitlistedStatus(StudentSectionEnrollmentStatus status) {
        String code = status == null ? null : status.getCode();
        return "WAITLISTED".equalsIgnoreCase(code);
    }

    @Transactional
    public CourseSectionStudentResponse postGrade(
            Long sectionId,
            Long enrollmentId,
            PostCourseSectionStudentGradeRequest request,
            Long actorUserId
    ) {
        validatePositiveId(sectionId, "Course section id");
        validatePositiveId(enrollmentId, "Enrollment id");
        requireRequestBody(request);

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        StudentSectionGradeType gradeType = referenceResolver.resolveGradeType(request.gradeTypeCode());
        GradeMark gradeMark = referenceResolver.resolveGradeMark(request.gradeMarkCode());
        SisUser actorUser = referenceResolver.resolveOptionalUser(actorUserId);
        Optional<StudentSectionGrade> currentGrade = gradeRepository.findCurrentGradeByEnrollmentIdAndGradeTypeCode(
                enrollmentId,
                gradeType.getCode()
        );

        validateGradePost(enrollment, gradeType);

        if (currentGrade.isPresent() && currentGrade.get().getGradeMark() != null
                && currentGrade.get().getGradeMark().getId().equals(gradeMark.getId())) {
            return mapEnrollmentWithFreshGrades(enrollment);
        }

        requireReasonForGradeChange(currentGrade, request);

        boolean changedExistingGrade = currentGrade.isPresent();
        currentGrade.ifPresent(previousGrade -> {
            previousGrade.setCurrent(false);
            gradeRepository.saveAndFlush(previousGrade);
        });

        StudentSectionGrade grade = new StudentSectionGrade();
        grade.setStudentSectionEnrollment(enrollment);
        grade.setGradeType(gradeType);
        grade.setGradeMark(gradeMark);
        currentGrade.ifPresent(previousGrade -> {
            grade.setPreviousGradeMark(previousGrade.getGradeMark());
            grade.setChangedFromGrade(previousGrade);
            grade.setChangeReason(trimToNull(request.reason()));
        });
        grade.setPostedByUser(actorUser);

        gradeRepository.saveAndFlush(grade);
        enrollmentEventService.createEvent(
                enrollment,
                changedExistingGrade ? EVENT_TYPE_GRADE_CHANGED : EVENT_TYPE_GRADE_POSTED,
                enrollment.getStatus(),
                enrollment.getStatus(),
                actorUser,
                null
        );

        return mapEnrollmentWithFreshGrades(enrollment);
    }

    private void validateGradePost(
            StudentSectionEnrollment enrollment,
            StudentSectionGradeType gradeType
    ) {
        validateGradeableSectionStatus(enrollment);
        validateGradeableEnrollmentStatus(enrollment);
        validatePostableGradeType(gradeType);
    }

    private void requireReasonForGradeChange(
            Optional<StudentSectionGrade> currentGrade,
            PostCourseSectionStudentGradeRequest request
    ) {
        if (currentGrade.isPresent() && trimToNull(request.reason()) == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A reason is required when changing an existing grade."
            );
        }
    }

    private CourseSectionStudentResponse mapEnrollmentWithFreshGrades(StudentSectionEnrollment enrollment) {
        return studentSectionEnrollmentMapper.toStudentResponse(
                enrollment,
                gradeRepository.findAllByEnrollmentId(enrollment.getId()),
                findLatestWaitlistOffer(enrollment.getId())
        );
    }

    private void validateGradeableSectionStatus(StudentSectionEnrollment enrollment) {
        CourseSection section = enrollment.getCourseSection();
        String statusCode = section == null || section.getStatus() == null
                ? null
                : section.getStatus().getCode();

        if (statusCode == null || !GRADEABLE_SECTION_STATUS_CODES.contains(statusCode.toUpperCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Grades can only be posted when the course section is in progress or completed."
            );
        }
    }

    private void validateGradeableEnrollmentStatus(StudentSectionEnrollment enrollment) {
        StudentSectionEnrollmentStatus status = enrollment.getStatus();
        String statusCode = status == null ? null : status.getCode();

        if (statusCode == null || !GRADEABLE_ENROLLMENT_STATUS_CODES.contains(statusCode.toUpperCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Grades can only be posted for registered or completed enrollments."
            );
        }
    }

    private void validatePostableGradeType(StudentSectionGradeType gradeType) {
        String gradeTypeCode = gradeType == null ? null : gradeType.getCode();

        if (gradeTypeCode == null || !POSTABLE_GRADE_TYPE_CODES.contains(gradeTypeCode.toUpperCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only midterm and final grades can be posted."
            );
        }
    }

    @Transactional(readOnly = true)
    public CourseSectionStudentEnrollmentEventListResponse getEnrollmentEvents(
            Long sectionId,
            Long enrollmentId,
            int page,
            int size
    ) {
        validatePositiveId(sectionId, "Course section id");
        validatePositiveId(enrollmentId, "Enrollment id");
        validatePageRequest(page, size, 100);

        enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Page<CourseSectionStudentEnrollmentEventResponse> eventsPage = enrollmentEventService
                .findPageByEnrollmentId(enrollmentId, PageRequest.of(page, size))
                .map(studentSectionEnrollmentMapper::toEventResponse);

        return new CourseSectionStudentEnrollmentEventListResponse(
                sectionId,
                enrollmentId,
                eventsPage.getContent(),
                eventsPage.getNumber(),
                eventsPage.getSize(),
                eventsPage.getTotalElements(),
                eventsPage.getTotalPages()
        );
    }

    private Map<Long, List<StudentSectionGrade>> findCurrentGrades(List<StudentSectionEnrollment> enrollments) {
        List<Long> enrollmentIds = enrollments.stream()
                .map(StudentSectionEnrollment::getId)
                .toList();

        if (enrollmentIds.isEmpty()) {
            return Map.of();
        }

        return gradeRepository.findCurrentGradesByEnrollmentIds(enrollmentIds).stream()
                .collect(Collectors.groupingBy(grade -> grade.getStudentSectionEnrollment().getId()));
    }

    private Map<Long, StudentSectionWaitlistOffer> findLatestWaitlistOffers(
            List<StudentSectionEnrollment> enrollments
    ) {
        List<Long> enrollmentIds = enrollments.stream()
                .map(StudentSectionEnrollment::getId)
                .filter(id -> id != null)
                .toList();
        if (enrollmentIds.isEmpty()) {
            return Map.of();
        }

        return waitlistOfferRepository.findByStudentSectionEnrollmentIdInOrderByCreatedAtDesc(enrollmentIds).stream()
                .filter(offer -> offer.getStudentSectionEnrollment() != null)
                .collect(Collectors.toMap(
                        offer -> offer.getStudentSectionEnrollment().getId(),
                        offer -> offer,
                        (existing, ignored) -> existing
                ));
    }

    private StudentSectionWaitlistOffer findLatestWaitlistOffer(Long enrollmentId) {
        if (enrollmentId == null) {
            return null;
        }

        return waitlistOfferRepository.findByStudentSectionEnrollmentIdInOrderByCreatedAtDesc(List.of(enrollmentId))
                .stream()
                .findFirst()
                .orElse(null);
    }

    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseSortDirection(sortDirection);
        String normalizedSortBy = sortBy == null ? "student" : sortBy.trim();
        String sortPath = SORT_FIELDS.get(normalizedSortBy);

        if (sortPath == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: " + String.join(", ", SORT_FIELDS.keySet()) + "."
            );
        }

        return Sort.by(direction, sortPath)
                .and(Sort.by(Sort.Direction.ASC, "student.firstName"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        try {
            return Sort.Direction.fromString(sortDirection == null ? "asc" : sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

    private void validatePositiveId(Long id, String label) {
        requireGreaterThanZero(id, label);
    }

}
