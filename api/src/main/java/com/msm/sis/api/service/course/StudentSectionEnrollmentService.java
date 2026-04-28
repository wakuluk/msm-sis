package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.AddCourseSectionStudentRequest;
import com.msm.sis.api.dto.course.CourseSectionStudentEnrollmentEventResponse;
import com.msm.sis.api.dto.course.CourseSectionStudentEnrollmentEventListResponse;
import com.msm.sis.api.dto.course.CourseSectionStudentGradeResponse;
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
import com.msm.sis.api.entity.StudentSectionEnrollmentEvent;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionGrade;
import com.msm.sis.api.entity.StudentSectionGradeType;
import com.msm.sis.api.mapper.StudentSectionEnrollmentMapper;
import com.msm.sis.api.patch.PatchValue;
import com.msm.sis.api.repository.CourseSectionRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentEventRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentSectionGradeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class StudentSectionEnrollmentService {
    private static final String REGISTERED_STATUS_CODE = "REGISTERED";
    private static final String WAITLISTED_STATUS_CODE = "WAITLISTED";
    private static final String DEFAULT_EVENT_TYPE_ADDED = "ADDED";
    private static final String EVENT_TYPE_GRADE_POSTED = "GRADE_POSTED";
    private static final String EVENT_TYPE_GRADE_CHANGED = "GRADE_CHANGED";

    private static final Map<String, String> SORT_FIELDS = Map.of(
            "student", "student.lastName",
            "status", "status.sortOrder",
            "registeredAt", "registeredAt",
            "waitlistPosition", "waitlistPosition",
            "creditsAttempted", "creditsAttempted"
    );

    private final CourseSectionRepository courseSectionRepository;
    private final StudentRepository studentRepository;
    private final StudentSectionEnrollmentEventRepository enrollmentEventRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;
    private final StudentSectionEnrollmentMapper studentSectionEnrollmentMapper;
    private final StudentSectionEnrollmentReferenceResolver referenceResolver;
    private final StudentSectionGradeRepository gradeRepository;

    @Transactional(readOnly = true)
    public CourseSectionStudentListResponse getSectionStudents(
            Long sectionId,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        validatePositiveId(sectionId, "Course section id");
        validatePageRequest(page, size);

        Pageable pageable = PageRequest.of(page, size, buildSort(sortBy, sortDirection));
        Page<StudentSectionEnrollment> enrollmentsPage = enrollmentRepository.findPageBySectionId(
                sectionId,
                pageable
        );
        Map<Long, List<StudentSectionGrade>> currentGrades = findCurrentGrades(enrollmentsPage.getContent());

        return new CourseSectionStudentListResponse(
                sectionId,
                enrollmentsPage.getContent().stream()
                        .map(enrollment -> studentSectionEnrollmentMapper.toStudentResponse(
                                enrollment,
                                currentGrades.get(enrollment.getId())
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

        return studentSectionEnrollmentMapper.toStudentResponse(enrollment, enrollment.getGrades());
    }

    @Transactional
    public CourseSectionStudentResponse addStudentToSection(
            Long sectionId,
            AddCourseSectionStudentRequest request,
            Long actorUserId
    ) {
        validatePositiveId(sectionId, "Course section id");
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        validatePositiveId(request.studentId(), "Student id");

        CourseSection courseSection = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student id is invalid."));

        if (enrollmentRepository.existsBySectionIdAndStudentId(sectionId, request.studentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student is already assigned to this section.");
        }

        StudentSectionEnrollmentStatus status = referenceResolver.resolveEnrollmentStatus(determineStatusCode(courseSection, request));
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
        applyStatusDates(enrollment, status, actorUser);

        if (isWaitlisted(status)) {
            enrollment.setWaitlistPosition(nextWaitlistPosition(sectionId));
        }

        StudentSectionEnrollment savedEnrollment = enrollmentRepository.saveAndFlush(enrollment);
        createEvent(savedEnrollment, DEFAULT_EVENT_TYPE_ADDED, null, status, actorUser, request.manualAddReason());

        return studentSectionEnrollmentMapper.toStudentResponse(savedEnrollment, List.of());
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
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        SisUser actorUser = referenceResolver.resolveOptionalUser(actorUserId);
        StudentSectionEnrollmentStatus priorStatus = enrollment.getStatus();

        applyEnrollmentPatch(enrollment, request, actorUser);

        StudentSectionEnrollment savedEnrollment = enrollmentRepository.saveAndFlush(enrollment);
        if (request.getStatusCode().isPresent()) {
            createEvent(
                    savedEnrollment,
                    statusChangeEventType(priorStatus, savedEnrollment.getStatus()),
                    priorStatus,
                    savedEnrollment.getStatus(),
                    actorUser,
                    request.getReason().orElse(null)
            );
        }

        return studentSectionEnrollmentMapper.toStudentResponse(savedEnrollment, savedEnrollment.getGrades());
    }

    @Transactional
    public CourseSectionStudentGradeResponse postGrade(
            Long sectionId,
            Long enrollmentId,
            PostCourseSectionStudentGradeRequest request,
            Long actorUserId
    ) {
        validatePositiveId(sectionId, "Course section id");
        validatePositiveId(enrollmentId, "Enrollment id");
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        StudentSectionGradeType gradeType = referenceResolver.resolveGradeType(request.gradeTypeCode());
        GradeMark gradeMark = referenceResolver.resolveGradeMark(request.gradeMarkCode());
        SisUser actorUser = referenceResolver.resolveOptionalUser(actorUserId);

        boolean changedExistingGrade = gradeRepository.expireCurrentGradesByEnrollmentIdAndGradeTypeCode(
                enrollmentId,
                gradeType.getCode()
        ) > 0;

        StudentSectionGrade grade = new StudentSectionGrade();
        grade.setStudentSectionEnrollment(enrollment);
        grade.setGradeType(gradeType);
        grade.setGradeMark(gradeMark);
        grade.setPostedByUser(actorUser);

        StudentSectionGrade savedGrade = gradeRepository.saveAndFlush(grade);
        createEvent(
                enrollment,
                changedExistingGrade ? EVENT_TYPE_GRADE_CHANGED : EVENT_TYPE_GRADE_POSTED,
                enrollment.getStatus(),
                enrollment.getStatus(),
                actorUser,
                null
        );

        return studentSectionEnrollmentMapper.toGradeResponse(savedGrade);
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
        validatePageRequest(page, size);

        enrollmentRepository
                .findBySectionIdAndEnrollmentId(sectionId, enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Page<CourseSectionStudentEnrollmentEventResponse> eventsPage = enrollmentEventRepository
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

    private void applyEnrollmentPatch(
            StudentSectionEnrollment enrollment,
            PatchCourseSectionStudentEnrollmentRequest request,
            SisUser actorUser
    ) {
        if (request.getStatusCode().isPresent()) {
            StudentSectionEnrollmentStatus status = referenceResolver.resolveEnrollmentStatus(request.getStatusCode().orElse(null));
            enrollment.setStatus(status);
            applyStatusDates(enrollment, status, actorUser);
            if (isWaitlisted(status) && enrollment.getWaitlistPosition() == null) {
                enrollment.setWaitlistPosition(nextWaitlistPosition(enrollment.getCourseSection().getId()));
            }
            if (!isWaitlisted(status)) {
                enrollment.setWaitlistPosition(null);
                enrollment.setWaitlistedAt(null);
            }
        }

        applyPatchValue(request.getGradingBasisCode(), value -> enrollment.setGradingBasis(referenceResolver.resolveGradingBasis(value)));
        applyPatchValue(request.getCreditsAttempted(), value -> {
            validateNonNegative(value, "Credits attempted");
            enrollment.setCreditsAttempted(value);
        });
        applyPatchValue(request.getCreditsEarned(), value -> {
            validateNonNegative(value, "Credits earned");
            if (value != null && enrollment.getCreditsAttempted() != null && value.compareTo(enrollment.getCreditsAttempted()) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Credits earned cannot be greater than credits attempted."
                );
            }
            enrollment.setCreditsEarned(value);
        });
        applyPatchValue(request.getWaitlistPosition(), value -> {
            if (value != null && value <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Waitlist position must be greater than zero.");
            }
            enrollment.setWaitlistPosition(value);
        });
        applyPatchValue(request.getIncludeInGpa(), enrollment::setIncludeInGpa);
        applyPatchValue(request.getCapacityOverride(), enrollment::setCapacityOverride);
        applyPatchValue(request.getManualAddReason(), value -> enrollment.setManualAddReason(trimToNull(value)));
    }

    private String determineStatusCode(CourseSection courseSection, AddCourseSectionStudentRequest request) {
        String requestedStatusCode = trimToNull(request.statusCode());
        if (requestedStatusCode != null) {
            return requestedStatusCode;
        }

        long registeredCount = enrollmentRepository.countBySectionIdAndStatusCode(
                courseSection.getId(),
                REGISTERED_STATUS_CODE
        );
        boolean hasCapacity = courseSection.getCapacity() == null || registeredCount < courseSection.getCapacity();
        boolean capacityOverride = Optional.ofNullable(request.capacityOverride()).orElse(false);

        if (hasCapacity || capacityOverride) {
            return REGISTERED_STATUS_CODE;
        }
        if (courseSection.isWaitlistAllowed()) {
            return WAITLISTED_STATUS_CODE;
        }

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Course section is full and waitlist is not allowed."
        );
    }

    private void applyStatusDates(
            StudentSectionEnrollment enrollment,
            StudentSectionEnrollmentStatus status,
            SisUser actorUser
    ) {
        LocalDateTime now = LocalDateTime.now();
        enrollment.setStatusChangedAt(now);
        enrollment.setStatusChangedByUser(actorUser);

        if (isRegistered(status) && enrollment.getRegisteredAt() == null) {
            enrollment.setRegisteredAt(now);
        }
        if (isWaitlisted(status) && enrollment.getWaitlistedAt() == null) {
            enrollment.setWaitlistedAt(now);
        }
        if ("DROPPED".equalsIgnoreCase(status.getCode()) && enrollment.getDropDate() == null) {
            enrollment.setDropDate(statusEffectiveDate(enrollment));
        }
        if ("WITHDRAWN".equalsIgnoreCase(status.getCode()) && enrollment.getWithdrawDate() == null) {
            enrollment.setWithdrawDate(statusEffectiveDate(enrollment));
        }
    }

    private LocalDate statusEffectiveDate(StudentSectionEnrollment enrollment) {
        LocalDate today = LocalDate.now();
        LocalDate enrollmentDate = enrollment.getEnrollmentDate();

        if (enrollmentDate == null || !today.isBefore(enrollmentDate)) {
            return today;
        }

        return enrollmentDate;
    }

    private void createEvent(
            StudentSectionEnrollment enrollment,
            String eventType,
            StudentSectionEnrollmentStatus fromStatus,
            StudentSectionEnrollmentStatus toStatus,
            SisUser actorUser,
            String reason
    ) {
        StudentSectionEnrollmentEvent event = new StudentSectionEnrollmentEvent();
        event.setStudentSectionEnrollment(enrollment);
        event.setEventType(eventType);
        event.setFromStatus(fromStatus);
        event.setToStatus(toStatus);
        event.setActorUser(actorUser);
        event.setReason(trimToNull(reason));
        enrollmentEventRepository.save(event);
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

    private int nextWaitlistPosition(Long sectionId) {
        return enrollmentRepository.findMaxWaitlistPositionBySectionId(sectionId) + 1;
    }

    private boolean isRegistered(StudentSectionEnrollmentStatus status) {
        return status != null && REGISTERED_STATUS_CODE.equalsIgnoreCase(status.getCode());
    }

    private boolean isWaitlisted(StudentSectionEnrollmentStatus status) {
        return status != null && WAITLISTED_STATUS_CODE.equalsIgnoreCase(status.getCode());
    }

    private String statusChangeEventType(
            StudentSectionEnrollmentStatus fromStatus,
            StudentSectionEnrollmentStatus toStatus
    ) {
        if (fromStatus != null && isWaitlisted(fromStatus) && isRegistered(toStatus)) {
            return "MOVED_FROM_WAITLIST";
        }
        if (isRegistered(toStatus)) {
            return "REGISTERED";
        }
        if (isWaitlisted(toStatus)) {
            return "WAITLISTED";
        }
        return toStatus == null ? "STATUS_CHANGED" : toStatus.getCode();
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

    private void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }
        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }
    }

    private void validatePositiveId(Long id, String label) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be greater than zero.");
        }
    }

    private void validateNonNegative(BigDecimal value, String label) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be zero or greater.");
        }
    }

    private <T> void applyPatchValue(PatchValue<T> patchValue, java.util.function.Consumer<T> consumer) {
        if (patchValue.isPresent()) {
            consumer.accept(patchValue.getValue());
        }
    }
}
