package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.course.AddStudentCourseRegistrationSelectionRequest;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationFailureResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationEnrollmentResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationRequisiteGroupResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationRequisiteResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationScheduleConflictResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationScheduleMeetingResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationSelectionResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationSubmitResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationWarningResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationWindowResponse;
import com.msm.sis.api.dto.registration.course.SubmitStudentCourseRegistrationRequest;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseSectionStatus;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentCourseRegistrationSelection;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionWaitlistOffer;
import com.msm.sis.api.mapper.StudentCourseRegistrationMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.CourseSectionRepository;
import com.msm.sis.api.repository.GradingBasisRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentCourseRegistrationSelectionRepository;
import com.msm.sis.api.repository.StudentHonorsRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentSectionWaitlistOfferRepository;
import com.msm.sis.api.service.course.StudentSectionEnrollmentEventService;
import com.msm.sis.api.service.course.StudentSectionEnrollmentReferenceResolver;
import com.msm.sis.api.service.course.StudentSectionEnrollmentStatusService;
import com.msm.sis.api.service.course.StudentSectionWaitlistActivationService;
import com.msm.sis.api.service.student.StudentAcademicCareerEligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.Comparator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentCourseRegistrationService {
    private static final Set<String> STUDENT_REGISTRATION_SECTION_STATUSES = Set.of("PLANNED");
    private static final List<String> SEAT_HOLDING_STATUS_CODES = List.of(
            "REGISTERED",
            "IN_PROGRESS"
    );

    private final AcademicTermRepository academicTermRepository;
    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final CourseSectionMeetingRepository courseSectionMeetingRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final StudentCourseRegistrationContextService contextService;
    private final GradingBasisRepository gradingBasisRepository;
    private final StudentCourseRegistrationMapper mapper;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final SisUserRepository sisUserRepository;
    private final StudentCourseRegistrationSelectionRepository selectionRepository;
    private final StudentRepository studentRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;
    private final StudentCourseScheduleConflictService scheduleConflictService;
    private final StudentCourseDuplicateRegistrationService duplicateRegistrationService;
    private final StudentCourseRequisiteValidationService requisiteValidationService;
    private final StudentCoursePrerequisiteEvidenceService prerequisiteEvidenceService;
    private final StudentCourseRegistrationRequisiteDisplayService requisiteDisplayService;
    private final StudentAcademicCareerEligibilityService academicCareerEligibilityService;
    private final StudentHonorsRepository studentHonorsRepository;
    private final StudentSectionEnrollmentEventService enrollmentEventService;
    private final StudentSectionEnrollmentReferenceResolver enrollmentReferenceResolver;
    private final StudentSectionEnrollmentStatusService enrollmentStatusService;
    private final StudentSectionWaitlistOfferRepository waitlistOfferRepository;
    private final StudentSectionWaitlistActivationService waitlistActivationService;

    @Transactional(readOnly = true)
    public StudentCourseRegistrationResponse getCourseRegistrationForAuthenticatedStudent(Long userId) {
        return getCourseRegistrationForAuthenticatedStudent(userId, null, null);
    }

    @Transactional(readOnly = true)
    public StudentCourseRegistrationResponse getCourseRegistrationForAuthenticatedStudent(
            Long userId,
            Long registrationGroupId,
            Long termId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        StudentCourseRegistrationWindowResponse registrationWindow =
                contextService.getRegistrationWindowForStudent(student.getId(), registrationGroupId, termId);
        AcademicTerm term = academicTermRepository.findDetailedById(registrationWindow.termId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration term was not found."
                ));

        List<StudentCourseRegistrationSelection> selections = selectionRepository.findSelectionsForStudentAndGroup(
                student.getId(),
                registrationWindow.registrationGroupId()
        );
        List<StudentSectionEnrollment> enrollments = enrollmentRepository.findCourseRegistrationEnrollmentsForStudentAndTerm(
                student.getId(),
                registrationWindow.termId()
        );
        Map<Long, StudentSectionWaitlistOffer> waitlistOffersByEnrollmentId = findLatestWaitlistOffers(enrollments);
        attachSectionAssociations(selections, enrollments);
        Map<Long, EnrollmentCounts> countsBySectionId = findEnrollmentCountsBySectionId(selections, enrollments);
        Set<Long> selectedCourseIds = findSelectedCourseIds(selections);
        List<StudentCoursePlannedPrerequisiteEvidence> plannedPrerequisiteEvidence =
                prerequisiteEvidenceService.toPlannedPrerequisiteEvidence(selections);

        List<StudentCourseRegistrationSelectionResponse> selectionResponses = selections.stream()
                .map(selection -> {
                    Long sectionId = sectionId(selection.getCourseSection());
                    EnrollmentCounts counts = countsBySectionId.getOrDefault(sectionId, EnrollmentCounts.EMPTY);
                    List<StudentCourseRegistrationRequisiteResponse> requisites = findRequisites(
                            student.getId(),
                            selection.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );
                    List<StudentCourseRegistrationRequisiteGroupResponse> requisiteGroups = findRequisiteGroups(
                            student.getId(),
                            selection.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );
                    List<String> corequisiteWarnings = findCorequisiteWarnings(
                            student.getId(),
                            selection,
                            selectedCourseIds
                    );
                    String honorsWarningMessage = findHonorsWarningMessage(
                            student.getId(),
                            selection.getCourseSection()
                    );

                    return mapper.toSelectionResponse(
                            term,
                            selection,
                            counts.enrolledCount(),
                            counts.waitlistCount(),
                            requisites,
                            requisiteGroups,
                            corequisiteWarnings,
                            honorsWarningMessage
                    );
                })
                .toList();
        List<StudentCourseRegistrationEnrollmentResponse> enrolledResponses = enrollments.stream()
                .filter(enrollment -> !mapper.isWaitlisted(enrollment))
                .map(enrollment -> {
                    Long sectionId = sectionId(enrollment.getCourseSection());
                    EnrollmentCounts counts = countsBySectionId.getOrDefault(sectionId, EnrollmentCounts.EMPTY);
                    List<StudentCourseRegistrationRequisiteResponse> requisites = findRequisites(
                            student.getId(),
                            enrollment.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );
                    List<StudentCourseRegistrationRequisiteGroupResponse> requisiteGroups = findRequisiteGroups(
                            student.getId(),
                            enrollment.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );

                    return mapper.toEnrollmentResponse(
                            term,
                            enrollment,
                            waitlistOffersByEnrollmentId.get(enrollment.getId()),
                            counts.enrolledCount(),
                            counts.waitlistCount(),
                            requisites,
                            requisiteGroups
                    );
                })
                .toList();
        List<StudentCourseRegistrationEnrollmentResponse> waitlistedResponses = enrollments.stream()
                .filter(mapper::isWaitlisted)
                .map(enrollment -> {
                    Long sectionId = sectionId(enrollment.getCourseSection());
                    EnrollmentCounts counts = countsBySectionId.getOrDefault(sectionId, EnrollmentCounts.EMPTY);
                    List<StudentCourseRegistrationRequisiteResponse> requisites = findRequisites(
                            student.getId(),
                            enrollment.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );
                    List<StudentCourseRegistrationRequisiteGroupResponse> requisiteGroups = findRequisiteGroups(
                            student.getId(),
                            enrollment.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );

                    return mapper.toEnrollmentResponse(
                            term,
                            enrollment,
                            waitlistOffersByEnrollmentId.get(enrollment.getId()),
                            counts.enrolledCount(),
                            counts.waitlistCount(),
                            requisites,
                            requisiteGroups
                    );
                })
                .toList();
        List<StudentCourseRegistrationEnrollmentResponse> expiredWaitlistResponses = enrollments.stream()
                .filter(this::isWaitlistExpired)
                .map(enrollment -> {
                    Long sectionId = sectionId(enrollment.getCourseSection());
                    EnrollmentCounts counts = countsBySectionId.getOrDefault(sectionId, EnrollmentCounts.EMPTY);
                    List<StudentCourseRegistrationRequisiteResponse> requisites = findRequisites(
                            student.getId(),
                            enrollment.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );
                    List<StudentCourseRegistrationRequisiteGroupResponse> requisiteGroups = findRequisiteGroups(
                            student.getId(),
                            enrollment.getCourseSection(),
                            plannedPrerequisiteEvidence
                    );

                    return mapper.toEnrollmentResponse(
                            term,
                            enrollment,
                            waitlistOffersByEnrollmentId.get(enrollment.getId()),
                            counts.enrolledCount(),
                            counts.waitlistCount(),
                            requisites,
                            requisiteGroups
                    );
                })
                .toList();
        List<StudentCourseRegistrationScheduleMeetingResponse> scheduleMeetings = new ArrayList<>();
        selections.forEach(selection -> scheduleMeetings.addAll(mapper.toSelectionScheduleMeetings(term, selection)));
        enrollments.stream()
                .filter(enrollment -> !isWaitlistExpired(enrollment))
                .forEach(enrollment -> scheduleMeetings.addAll(mapper.toEnrollmentScheduleMeetings(term, enrollment)));

        return new StudentCourseRegistrationResponse(
                student.getId(),
                displayName(student),
                registrationWindow,
                selectionResponses,
                enrolledResponses,
                waitlistedResponses,
                expiredWaitlistResponses,
                List.copyOf(scheduleMeetings)
        );
    }

    @Transactional
    public StudentCourseRegistrationResponse acceptWaitlistOfferForAuthenticatedStudent(
            Long userId,
            Long offerId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        StudentSectionWaitlistOffer offer = waitlistOfferRepository.findByIdAndStatus(offerId, "OFFERED")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Active waitlist offer was not found."
                ));
        return acceptWaitlistOffer(userId, student, offer);
    }

    @Transactional
    public StudentCourseRegistrationResponse acceptWaitlistOfferForEnrollmentForAuthenticatedStudent(
            Long userId,
            Long enrollmentId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        StudentSectionWaitlistOffer offer = waitlistOfferRepository
                .findByStudentSectionEnrollmentIdAndStatus(enrollmentId, "OFFERED")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Active waitlist offer was not found."
                ));
        return acceptWaitlistOffer(userId, student, offer);
    }

    private StudentCourseRegistrationResponse acceptWaitlistOffer(
            Long userId,
            Student student,
            StudentSectionWaitlistOffer offer
    ) {
        if (offer.getStudent() == null || !Objects.equals(offer.getStudent().getId(), student.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Active waitlist offer was not found.");
        }
        if (offer.getExpiresAt() == null || !offer.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Waitlist offer has expired.");
        }

        StudentSectionEnrollment enrollment = offer.getStudentSectionEnrollment();
        if (enrollment == null || !isWaitlistedStatus(enrollment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Waitlist offer is no longer available.");
        }

        CourseSection section = offer.getCourseSection();
        assertNoWaitlistOfferScheduleConflicts(student.getId(), section);
        validateSeatAvailableForWaitlistOffer(section);

        StudentSectionEnrollmentStatus priorStatus = enrollment.getStatus();
        StudentSectionEnrollmentStatus registeredStatus =
                enrollmentReferenceResolver.resolveEnrollmentStatus("REGISTERED");
        SisUser actorUser = sisUserRepository.findById(userId).orElse(null);

        enrollment.setStatus(registeredStatus);
        enrollmentStatusService.applyStatusDates(enrollment, registeredStatus, actorUser);
        enrollmentStatusService.applyWaitlistState(enrollment, registeredStatus);
        StudentSectionEnrollment savedEnrollment = enrollmentRepository.saveAndFlush(enrollment);

        offer.setStatus("ACCEPTED");
        waitlistOfferRepository.saveAndFlush(offer);

        enrollmentEventService.createEvent(
                savedEnrollment,
                enrollmentStatusService.statusChangeEventType(priorStatus, registeredStatus),
                priorStatus,
                registeredStatus,
                actorUser,
                "Student accepted waitlist offer."
        );

        AcademicTerm term = resolveSectionTerm(section);
        return getCourseRegistrationForAuthenticatedStudent(userId, null, term.getId());
    }

    private void assertNoWaitlistOfferScheduleConflicts(Long studentId, CourseSection section) {
        AcademicTerm term = resolveSectionTerm(section);
        RegistrationGroup registrationGroup = registrationGroupStudentRepository
                .findViewableAssignmentsForStudentAndTerm(studentId, term.getId())
                .stream()
                .map(RegistrationGroupStudent::getRegistrationGroup)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        if (registrationGroup != null) {
            scheduleConflictService.assertNoConflicts(studentId, registrationGroup, section);
        }
    }

    @Transactional
    public StudentCourseRegistrationResponse addSelectionForAuthenticatedStudent(
            Long userId,
            AddStudentCourseRegistrationSelectionRequest request
    ) {
        return addSelectionForAuthenticatedStudent(userId, request, null, null);
    }

    @Transactional
    public StudentCourseRegistrationResponse addSelectionForAuthenticatedStudent(
            Long userId,
            AddStudentCourseRegistrationSelectionRequest request,
            Long registrationGroupId,
            Long termId
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selection request is required.");
        }
        if (request.sectionId() == null || request.sectionId() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section id is required.");
        }

        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        SisUser actorUser = sisUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user was not found."
                ));
        CourseSection section = courseSectionRepository.findById(request.sectionId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course section was not found."
                ));
        AcademicTerm sectionTerm = resolveSectionTerm(section);
        RegistrationGroup registrationGroup = resolveStudentRegistrationGroup(
                student.getId(),
                sectionTerm,
                section,
                registrationGroupId,
                termId
        );

        validateSectionAvailable(section);
        validateNotAlreadySelected(student.getId(), registrationGroup.getId(), section.getId());
        validateNotAlreadyEnrolled(student.getId(), section.getId());
        validateNotAlreadyRegisteredForCourse(student.getId(), registrationGroup, section);

        GradingBasis selectedGradingBasis = resolveSelectedGradingBasis(request, section);
        BigDecimal selectedCredits = resolveSelectedCredits(request, section);

        List<StudentCoursePlannedPrerequisiteEvidence> plannedPrerequisiteEvidence =
                prerequisiteEvidenceService.findPlannedPrerequisiteEvidenceForRegistrationGroup(
                        student.getId(),
                        registrationGroup.getId()
                );
        requisiteValidationService.validateForPreRegistration(
                student.getId(),
                section,
                plannedPrerequisiteEvidence
        );
        scheduleConflictService.assertNoConflicts(student.getId(), registrationGroup, section);
        validateAcademicCareerAllowsSection(student.getId(), section);
        validateHonorsAllowsSection(student.getId(), section);

        StudentCourseRegistrationSelection selection = new StudentCourseRegistrationSelection();
        selection.setStudent(student);
        selection.setCourseSection(section);
        selection.setRegistrationGroup(registrationGroup);
        selection.setSelectedGradingBasis(selectedGradingBasis);
        selection.setSelectedCredits(selectedCredits);
        selection.setCreatedByUser(actorUser);
        selection.setUpdatedByUser(actorUser);
        selectionRepository.save(selection);

        return getCourseRegistrationForAuthenticatedStudent(userId, registrationGroup.getId(), null);
    }

    @Transactional
    public StudentCourseRegistrationResponse removeSelectionForAuthenticatedStudent(
            Long userId,
            Long selectionId
    ) {
        return removeSelectionForAuthenticatedStudent(userId, selectionId, null, null);
    }

    @Transactional
    public StudentCourseRegistrationResponse removeSelectionForAuthenticatedStudent(
            Long userId,
            Long selectionId,
            Long registrationGroupId,
            Long termId
    ) {
        if (selectionId == null || selectionId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selection id is required.");
        }

        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        StudentCourseRegistrationWindowResponse registrationWindow =
                contextService.getRegistrationWindowForStudent(student.getId(), registrationGroupId, termId);
        validateRegistrationGroupPublished(registrationWindow);
        StudentCourseRegistrationSelection selection = selectionRepository.findSelectionForStudent(
                        selectionId,
                        student.getId()
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course registration selection was not found for this student."
                ));
        Long selectionGroupId = selection.getRegistrationGroup() == null
                ? null
                : selection.getRegistrationGroup().getId();
        if (!Objects.equals(selectionGroupId, registrationWindow.registrationGroupId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course registration selection does not belong to the student's current registration group."
            );
        }

        selectionRepository.delete(selection);

        return getCourseRegistrationForAuthenticatedStudent(
                userId,
                registrationWindow.registrationGroupId(),
                null
        );
    }

    @Transactional
    public StudentCourseRegistrationResponse removeEnrollmentForAuthenticatedStudent(
            Long userId,
            Long enrollmentId,
            Long registrationGroupId,
            Long termId
    ) {
        if (enrollmentId == null || enrollmentId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enrollment id is required.");
        }

        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        StudentCourseRegistrationWindowResponse registrationWindow =
                contextService.getRegistrationWindowForStudent(student.getId(), registrationGroupId, termId);
        validateRegistrationWindowOpen(registrationWindow);

        StudentSectionEnrollment enrollment = enrollmentRepository
                .findRegistrationEnrollmentForStudent(enrollmentId, student.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course registration enrollment was not found for this student."
                ));
        CourseSection section = enrollment.getCourseSection();
        AcademicTerm enrollmentTerm = resolveSectionTerm(section);
        if (!Objects.equals(registrationWindow.termId(), enrollmentTerm.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course registration enrollment does not belong to the student's current registration term."
            );
        }

        boolean wasWaitlisted = isWaitlistedStatus(enrollment.getStatus());
        boolean wasSeatHolding = isSeatHoldingStatus(enrollment.getStatus());
        List<StudentSectionWaitlistOffer> enrollmentOffers =
                waitlistOfferRepository.findByStudentSectionEnrollmentId(enrollment.getId());
        enrollmentOffers.stream()
                .filter(offer -> "OFFERED".equalsIgnoreCase(offer.getStatus()))
                .forEach(offer -> offer.setStatus("CANCELLED"));
        if (!enrollmentOffers.isEmpty()) {
            waitlistOfferRepository.deleteAll(enrollmentOffers);
            waitlistOfferRepository.flush();
        }
        enrollmentRepository.delete(enrollment);
        if (wasWaitlisted && section != null && section.getId() != null) {
            enrollmentStatusService.compactWaitlistPositions(section.getId());
        }
        if (wasSeatHolding && section != null && section.getId() != null && section.isWaitlistAllowed()) {
            waitlistActivationService.activateNextWaitlistedStudent(section.getId());
        }

        return getCourseRegistrationForAuthenticatedStudent(
                userId,
                registrationWindow.registrationGroupId(),
                null
        );
    }

    @Transactional
    public StudentCourseRegistrationSubmitResponse submitRegistrationForAuthenticatedStudent(
            Long userId,
            SubmitStudentCourseRegistrationRequest request
    ) {
        return submitRegistrationForAuthenticatedStudent(userId, request, null, null);
    }

    @Transactional
    public StudentCourseRegistrationSubmitResponse submitRegistrationForAuthenticatedStudent(
            Long userId,
            SubmitStudentCourseRegistrationRequest request,
            Long registrationGroupId,
            Long termId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        SisUser actorUser = sisUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user was not found."
                ));
        StudentCourseRegistrationWindowResponse registrationWindow =
                contextService.getRegistrationWindowForStudent(student.getId(), registrationGroupId, termId);
        validateRegistrationWindowOpen(registrationWindow);

        List<StudentCourseRegistrationSelection> selections = selectionRepository.findSelectionsForStudentAndGroup(
                student.getId(),
                registrationWindow.registrationGroupId()
        );
        List<StudentCourseRegistrationSelection> selectedSelections = filterRequestedSelections(selections, request);
        List<StudentCourseRegistrationSelection> chronologicalSelections = sortSelectionsChronologically(selectedSelections);
        boolean waitlistIfFull = request == null || request.waitlistIfFull() == null || request.waitlistIfFull();

        List<Long> registeredEnrollmentIds = new ArrayList<>();
        List<Long> waitlistedEnrollmentIds = new ArrayList<>();
        List<StudentCourseRegistrationFailureResponse> failures = new ArrayList<>();
        List<StudentCourseRegistrationWarningResponse> warnings = new ArrayList<>();
        Set<Long> duplicateCourseSelectionIds = addDuplicateCourseFailures(
                student.getId(),
                selectedSelections,
                failures
        );
        Set<Long> scheduleConflictSelectionIds = addScheduleConflictFailures(
                student.getId(),
                selectedSelections.stream()
                        .filter(selection -> !duplicateCourseSelectionIds.contains(selection.getId()))
                        .toList(),
                failures
        );
        Set<Long> preRegistrationFailureIds = new HashSet<>();
        preRegistrationFailureIds.addAll(duplicateCourseSelectionIds);
        preRegistrationFailureIds.addAll(scheduleConflictSelectionIds);
        Set<Long> academicCareerEligibilityFailureIds = addAcademicCareerEligibilityFailures(
                student.getId(),
                chronologicalSelections.stream()
                        .filter(selection -> !preRegistrationFailureIds.contains(selection.getId()))
                        .toList(),
                failures
        );
        preRegistrationFailureIds.addAll(academicCareerEligibilityFailureIds);
        Set<Long> honorsEligibilityFailureIds = addHonorsEligibilityFailures(
                student.getId(),
                chronologicalSelections.stream()
                        .filter(selection -> !preRegistrationFailureIds.contains(selection.getId()))
                        .toList(),
                failures
        );
        preRegistrationFailureIds.addAll(honorsEligibilityFailureIds);
        Set<Long> prerequisiteFailureSelectionIds = addPrerequisiteFailures(
                student.getId(),
                chronologicalSelections.stream()
                        .filter(selection -> !preRegistrationFailureIds.contains(selection.getId()))
                        .toList(),
                failures
        );
        preRegistrationFailureIds.addAll(prerequisiteFailureSelectionIds);
        List<StudentCoursePlannedPrerequisiteEvidence> registrationPlannedPrerequisiteEvidence =
                prerequisiteEvidenceService.toPlannedPrerequisiteEvidence(chronologicalSelections.stream()
                        .filter(selection -> !preRegistrationFailureIds.contains(selection.getId()))
                        .toList());

        for (StudentCourseRegistrationSelection selection : chronologicalSelections) {
            if (preRegistrationFailureIds.contains(selection.getId())) {
                continue;
            }

            RegistrationAttemptResult result = registerSelection(
                    student,
                    actorUser,
                    registrationWindow,
                    selection,
                    registrationPlannedPrerequisiteEvidence,
                    waitlistIfFull
            );
            if (result.registeredEnrollmentId() != null) {
                registeredEnrollmentIds.add(result.registeredEnrollmentId());
            }
            if (result.waitlistedEnrollmentId() != null) {
                waitlistedEnrollmentIds.add(result.waitlistedEnrollmentId());
            }
            if (result.failure() != null) {
                failures.add(result.failure());
            } else {
                findHonorsSubmitWarning(student.getId(), selection)
                        .ifPresent(warnings::add);
            }
        }

        StudentCourseRegistrationResponse refreshed = getCourseRegistrationForAuthenticatedStudent(
                userId,
                registrationWindow.registrationGroupId(),
                null
        );
        Set<Long> registeredEnrollmentIdSet = Set.copyOf(registeredEnrollmentIds);
        Set<Long> waitlistedEnrollmentIdSet = Set.copyOf(waitlistedEnrollmentIds);
        List<StudentCourseRegistrationEnrollmentResponse> registered = refreshed.enrolled().stream()
                .filter(enrollment -> registeredEnrollmentIdSet.contains(enrollment.enrollmentId()))
                .toList();
        List<StudentCourseRegistrationEnrollmentResponse> waitlisted = refreshed.waitlisted().stream()
                .filter(enrollment -> waitlistedEnrollmentIdSet.contains(enrollment.enrollmentId()))
                .toList();
        List<StudentCourseRegistrationFailureResponse> retryableFailures = failures.stream()
                .filter(StudentCourseRegistrationFailureResponse::retryable)
                .toList();
        List<StudentCourseRegistrationFailureResponse> removedFailures = failures.stream()
                .filter(failure -> !failure.retryable())
                .toList();
        int failureCount = failures.size();
        String message = failureCount == 0
                ? "Registration submitted."
                : "Registration submitted with " + failureCount + " issue" + (failureCount == 1 ? "." : "s.");

        return new StudentCourseRegistrationSubmitResponse(
                message,
                selectedSelections.size(),
                registered.size(),
                waitlisted.size(),
                removedFailures.size(),
                retryableFailures.size(),
                registered,
                waitlisted,
                removedFailures,
                retryableFailures,
                List.copyOf(warnings),
                refreshed
        );
    }

    private List<StudentCourseRegistrationSelection> sortSelectionsChronologically(
            List<StudentCourseRegistrationSelection> selections
    ) {
        return selections.stream()
                .sorted(Comparator
                        .comparing(
                                (StudentCourseRegistrationSelection selection) -> subTermStartDate(selection.getCourseSection()),
                                Comparator.nullsLast(Comparator.naturalOrder())
                        )
                        .thenComparing(
                                selection -> subTermEndDate(selection.getCourseSection()),
                                Comparator.nullsLast(Comparator.naturalOrder())
                        )
                        .thenComparing(
                                selection -> courseCode(selection.getCourseSection()),
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                        )
                        .thenComparing(
                                StudentCourseRegistrationSelection::getId,
                                Comparator.nullsLast(Long::compareTo)
                        ))
                .toList();
    }

    private void validateRegistrationWindowOpen(StudentCourseRegistrationWindowResponse registrationWindow) {
        validateRegistrationGroupPublished(registrationWindow);
        if (!registrationWindow.registrationWindowOpen()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Registration window is not open."
            );
        }
    }

    private void validateRegistrationGroupPublished(StudentCourseRegistrationWindowResponse registrationWindow) {
        if (!RegistrationGroupStatusSupport.PUBLISHED.equals(normalizeCode(registrationWindow.statusCode()))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Registration group is not published."
            );
        }
    }

    private List<StudentCourseRegistrationSelection> filterRequestedSelections(
            List<StudentCourseRegistrationSelection> selections,
            SubmitStudentCourseRegistrationRequest request
    ) {
        if (request == null || request.selectionIds() == null || request.selectionIds().isEmpty()) {
            return selections;
        }

        Set<Long> requestedIds = request.selectionIds().stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
        Set<Long> availableIds = selections.stream()
                .map(StudentCourseRegistrationSelection::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!availableIds.containsAll(requestedIds)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "One or more selected courses are not in the student's registration cart."
            );
        }

        return selections.stream()
                .filter(selection -> requestedIds.contains(selection.getId()))
                .toList();
    }

    private Set<Long> addDuplicateCourseFailures(
            Long studentId,
            List<StudentCourseRegistrationSelection> selectedSelections,
            List<StudentCourseRegistrationFailureResponse> failures
    ) {
        if (selectedSelections.isEmpty()) {
            return Set.of();
        }

        Set<Long> failedSelectionIds = new HashSet<>();
        for (StudentCourseRegistrationSelection selection : selectedSelections) {
            duplicateRegistrationService.findDuplicateForRegistrationGroup(
                            studentId,
                            selection.getRegistrationGroup(),
                            selection.getCourseSection()
                    )
                    .ifPresent(duplicate -> {
                        failedSelectionIds.add(selection.getId());
                        CourseSection section = selection.getCourseSection();
                        failures.add(new StudentCourseRegistrationFailureResponse(
                                selection.getId(),
                                sectionId(section),
                                courseCode(section),
                                displaySectionCode(section),
                                "DUPLICATE_COURSE_SELECTION",
                                duplicate.message(),
                                false,
                                true
                        ));
                    });
        }

        return failedSelectionIds;
    }

    private Set<Long> addScheduleConflictFailures(
            Long studentId,
            List<StudentCourseRegistrationSelection> selectedSelections,
            List<StudentCourseRegistrationFailureResponse> failures
    ) {
        if (selectedSelections.isEmpty()) {
            return Set.of();
        }

        RegistrationGroup registrationGroup = selectedSelections.getFirst().getRegistrationGroup();
        Map<Long, List<StudentCourseRegistrationScheduleConflictResponse>> conflictsBySectionId =
                scheduleConflictService.findRegistrationConflictsBySectionId(
                        studentId,
                        registrationGroup,
                        selectedSelections.stream()
                                .map(StudentCourseRegistrationSelection::getCourseSection)
                                .toList()
                );
        if (conflictsBySectionId.isEmpty()) {
            return Set.of();
        }

        Set<Long> failedSelectionIds = new HashSet<>();
        for (StudentCourseRegistrationSelection selection : selectedSelections) {
            CourseSection section = selection.getCourseSection();
            Long sectionId = sectionId(section);
            List<StudentCourseRegistrationScheduleConflictResponse> conflicts =
                    conflictsBySectionId.getOrDefault(sectionId, List.of());
            if (conflicts.isEmpty()) {
                continue;
            }

            failedSelectionIds.add(selection.getId());
            failures.add(new StudentCourseRegistrationFailureResponse(
                    selection.getId(),
                    sectionId,
                    courseCode(section),
                    displaySectionCode(section),
                    "SCHEDULE_CONFLICT",
                    scheduleConflictService.buildConflictMessage(conflicts),
                    false,
                    true
            ));
        }

        return failedSelectionIds;
    }

    private Set<Long> addPrerequisiteFailures(
            Long studentId,
            List<StudentCourseRegistrationSelection> selectedSelections,
            List<StudentCourseRegistrationFailureResponse> failures
    ) {
        if (selectedSelections.isEmpty()) {
            return Set.of();
        }

        List<StudentCoursePlannedPrerequisiteEvidence> chronologicallySatisfiedSelections = new ArrayList<>();
        Set<Long> failedSelectionIds = new HashSet<>();
        for (StudentCourseRegistrationSelection selection : selectedSelections) {
            try {
                requisiteValidationService.validateForPreRegistration(
                        studentId,
                        selection.getCourseSection(),
                        chronologicallySatisfiedSelections
                );
                chronologicallySatisfiedSelections.addAll(
                        prerequisiteEvidenceService.toPlannedPrerequisiteEvidence(List.of(selection))
                );
            } catch (ResponseStatusException exception) {
                failedSelectionIds.add(selection.getId());
                CourseSection section = selection.getCourseSection();
                failures.add(new StudentCourseRegistrationFailureResponse(
                        selection.getId(),
                        sectionId(section),
                        courseCode(section),
                        displaySectionCode(section),
                        "PREREQUISITES_NOT_SATISFIED",
                        reason(exception, "Prerequisites are not satisfied."),
                        false,
                        true
                ));
            }
        }

        return failedSelectionIds;
    }

    private Set<Long> addAcademicCareerEligibilityFailures(
            Long studentId,
            List<StudentCourseRegistrationSelection> selectedSelections,
            List<StudentCourseRegistrationFailureResponse> failures
    ) {
        if (selectedSelections.isEmpty()) {
            return Set.of();
        }

        Set<Long> failedSelectionIds = new HashSet<>();
        for (StudentCourseRegistrationSelection selection : selectedSelections) {
            try {
                validateAcademicCareerAllowsSection(studentId, selection.getCourseSection());
            } catch (ResponseStatusException exception) {
                failedSelectionIds.add(selection.getId());
                CourseSection section = selection.getCourseSection();
                failures.add(new StudentCourseRegistrationFailureResponse(
                        selection.getId(),
                        sectionId(section),
                        courseCode(section),
                        displaySectionCode(section),
                        "ACADEMIC_CAREER_DIVISION_NOT_ALLOWED",
                        reason(
                                exception,
                                "This student's academic career does not allow registration for this course."
                        ),
                        false,
                        true
                ));
            }
        }

        return failedSelectionIds;
    }

    private Set<Long> addHonorsEligibilityFailures(
            Long studentId,
            List<StudentCourseRegistrationSelection> selectedSelections,
            List<StudentCourseRegistrationFailureResponse> failures
    ) {
        if (selectedSelections.isEmpty()) {
            return Set.of();
        }

        Set<Long> failedSelectionIds = new HashSet<>();
        for (StudentCourseRegistrationSelection selection : selectedSelections) {
            try {
                validateHonorsAllowsSection(studentId, selection.getCourseSection());
            } catch (ResponseStatusException exception) {
                failedSelectionIds.add(selection.getId());
                CourseSection section = selection.getCourseSection();
                failures.add(new StudentCourseRegistrationFailureResponse(
                        selection.getId(),
                        sectionId(section),
                        courseCode(section),
                        displaySectionCode(section),
                        "HONORS_ELIGIBILITY_NOT_SATISFIED",
                        reason(exception, "Only honors students may register for honors sections."),
                        false,
                        true
                ));
            }
        }

        return failedSelectionIds;
    }

    private Optional<StudentCourseRegistrationWarningResponse> findHonorsSubmitWarning(
            Long studentId,
            StudentCourseRegistrationSelection selection
    ) {
        CourseSection section = selection.getCourseSection();
        String honorsWarningMessage = findHonorsWarningMessage(studentId, section);
        if (honorsWarningMessage == null) {
            return Optional.empty();
        }

        return Optional.of(new StudentCourseRegistrationWarningResponse(
                selection.getId(),
                sectionId(section),
                courseCode(section),
                displaySectionCode(section),
                "HONORS_SECTION_AVAILABLE",
                honorsWarningMessage
        ));
    }

    private RegistrationAttemptResult registerSelection(
            Student student,
            SisUser actorUser,
            StudentCourseRegistrationWindowResponse registrationWindow,
            StudentCourseRegistrationSelection selection,
            List<StudentCoursePlannedPrerequisiteEvidence> plannedPrerequisiteEvidence,
            boolean waitlistIfFull
    ) {
        CourseSection section = selection.getCourseSection();
        try {
            validateSelectionStillBelongsToGroup(registrationWindow, selection);
            validateSectionAvailable(section);
            validateNotAlreadyEnrolled(student.getId(), section.getId());
            requisiteValidationService.validateForPreRegistration(
                student.getId(),
                section,
                plannedPrerequisiteEvidence
            );
            validateAcademicCareerAllowsSection(student.getId(), section);
            validateHonorsAllowsSection(student.getId(), section);

            StudentSectionEnrollmentStatus status = determineEnrollmentStatus(section, waitlistIfFull);
            StudentSectionEnrollment enrollment = createEnrollment(student, actorUser, selection, status);
            StudentSectionEnrollment savedEnrollment = enrollmentRepository.saveAndFlush(enrollment);
            enrollmentEventService.createEvent(
                    savedEnrollment,
                    enrollmentStatusService.statusChangeEventType(null, status),
                    null,
                    status,
                    actorUser,
                    null
            );
            selectionRepository.delete(selection);

            if (isWaitlistedStatus(status)) {
                return RegistrationAttemptResult.waitlistedResult(savedEnrollment.getId());
            }

            return RegistrationAttemptResult.registeredResult(savedEnrollment.getId());
        } catch (KnownRegistrationFailureException failure) {
            if (!failure.retryable()) {
                selectionRepository.delete(selection);
            }

            return RegistrationAttemptResult.failure(toFailureResponse(selection, failure));
        } catch (ResponseStatusException exception) {
            selectionRepository.delete(selection);
            String reason = reason(exception, "Course registration selection is no longer valid.");

            return RegistrationAttemptResult.failure(toFailureResponse(
                    selection,
                    new KnownRegistrationFailureException(
                            reason.toUpperCase(Locale.ROOT).contains("PREREQUISITE")
                                    ? "PREREQUISITES_NOT_SATISFIED"
                                    : "VALIDATION_FAILED",
                            reason,
                            false
                    )
            ));
        }
    }

    private void validateSelectionStillBelongsToGroup(
            StudentCourseRegistrationWindowResponse registrationWindow,
            StudentCourseRegistrationSelection selection
    ) {
        Long selectionGroupId = selection.getRegistrationGroup() == null
                ? null
                : selection.getRegistrationGroup().getId();
        if (!Objects.equals(selectionGroupId, registrationWindow.registrationGroupId())) {
            throw new KnownRegistrationFailureException(
                    "SELECTION_GROUP_MISMATCH",
                    "Selection does not belong to the student's current registration group.",
                    false
            );
        }

        Long sectionSubTermId = selection.getCourseSection() == null || selection.getCourseSection().getSubTerm() == null
                ? null
                : selection.getCourseSection().getSubTerm().getId();
        boolean sectionInWindow = registrationWindow.subTerms().stream()
                .anyMatch(subTerm -> Objects.equals(subTerm.subTermId(), sectionSubTermId));
        if (!sectionInWindow) {
            throw new KnownRegistrationFailureException(
                    "SECTION_TERM_MISMATCH",
                    "Section no longer belongs to the student's registration term.",
                    false
            );
        }
    }

    private StudentSectionEnrollmentStatus determineEnrollmentStatus(
            CourseSection section,
            boolean waitlistIfFull
    ) {
        long seatHoldingCount = countSeatHoldingEnrollments(section);
        boolean seatAvailable = section.getCapacity() == null || seatHoldingCount < section.getCapacity();
        boolean hardCapacityReached = section.getHardCapacity() != null && seatHoldingCount >= section.getHardCapacity();

        if (seatAvailable && !hardCapacityReached) {
            return enrollmentReferenceResolver.resolveEnrollmentStatus("REGISTERED");
        }

        if (section.isWaitlistAllowed() && waitlistIfFull) {
            return enrollmentReferenceResolver.resolveEnrollmentStatus("WAITLISTED");
        }

        throw new KnownRegistrationFailureException(
                section.isWaitlistAllowed() ? "SECTION_FULL_WAITLIST_DECLINED" : "SECTION_FULL",
                section.isWaitlistAllowed()
                        ? "Course section is full and was not added to the waitlist."
                        : "Course section is full and waitlist is not allowed.",
                false
        );
    }

    private void validateSeatAvailableForWaitlistOffer(CourseSection section) {
        if (section == null || section.getId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Waitlist offer is no longer available.");
        }

        long seatHoldingCount = countSeatHoldingEnrollments(section);
        if (section.getHardCapacity() != null && seatHoldingCount >= section.getHardCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course section has reached its hard capacity.");
        }
        if (section.getCapacity() != null && seatHoldingCount >= section.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seat is no longer available.");
        }
    }

    private long countSeatHoldingEnrollments(CourseSection section) {
        return enrollmentRepository.countBySectionIdAndStatusCodes(
                section.getId(),
                SEAT_HOLDING_STATUS_CODES
        );
    }

    private StudentSectionEnrollment createEnrollment(
            Student student,
            SisUser actorUser,
            StudentCourseRegistrationSelection selection,
            StudentSectionEnrollmentStatus status
    ) {
        StudentSectionEnrollment enrollment = new StudentSectionEnrollment();
        enrollment.setStudent(student);
        enrollment.setCourseSection(selection.getCourseSection());
        enrollment.setStatus(status);
        enrollment.setGradingBasis(selection.getSelectedGradingBasis());
        enrollment.setEnrollmentDate(LocalDate.now());
        enrollment.setCreditsAttempted(selection.getSelectedCredits());
        enrollment.setIncludeInGpa(true);
        enrollment.setCapacityOverride(false);
        enrollmentStatusService.applyStatusDates(enrollment, status, actorUser);
        enrollmentStatusService.applyWaitlistState(enrollment, status);

        return enrollment;
    }

    private StudentCourseRegistrationFailureResponse toFailureResponse(
            StudentCourseRegistrationSelection selection,
            KnownRegistrationFailureException failure
    ) {
        CourseSection section = selection.getCourseSection();

        return new StudentCourseRegistrationFailureResponse(
                selection.getId(),
                section == null ? null : section.getId(),
                courseCode(section),
                displaySectionCode(section),
                failure.failureCode(),
                failure.getMessage(),
                failure.retryable(),
                failure.retryable()
        );
    }

    private String reason(ResponseStatusException exception, String fallback) {
        String reason = trimToNull(exception.getReason());
        return reason == null ? fallback : reason;
    }

    private boolean isWaitlistedStatus(StudentSectionEnrollmentStatus status) {
        return status != null && "WAITLISTED".equalsIgnoreCase(status.getCode());
    }

    private boolean isSeatHoldingStatus(StudentSectionEnrollmentStatus status) {
        String code = status == null ? null : status.getCode();
        return "REGISTERED".equalsIgnoreCase(code) || "IN_PROGRESS".equalsIgnoreCase(code);
    }

    private boolean isWaitlistExpired(StudentSectionEnrollment enrollment) {
        StudentSectionEnrollmentStatus status = enrollment == null ? null : enrollment.getStatus();
        return status != null && "WAITLIST_EXPIRED".equalsIgnoreCase(status.getCode());
    }

    private AcademicTerm resolveSectionTerm(CourseSection section) {
        if (section.getSubTerm() == null || section.getSubTerm().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course section is not linked to a registration subterm."
            );
        }

        return academicTermRepository.findByAcademicSubTerms_Id(section.getSubTerm().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course section is not linked to a registration term."
                ));
    }

    private RegistrationGroup resolveStudentRegistrationGroup(
            Long studentId,
            AcademicTerm sectionTerm,
            CourseSection section,
            Long registrationGroupId,
            Long termId
    ) {
        StudentCourseRegistrationWindowResponse registrationWindow =
                contextService.getRegistrationWindowForStudent(studentId, registrationGroupId, termId);
        validateRegistrationGroupPublished(registrationWindow);

        if (!Objects.equals(registrationWindow.termId(), sectionTerm.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course section does not belong to the selected registration term."
            );
        }

        RegistrationGroupStudent assignment = registrationGroupStudentRepository
                .findViewableAssignmentByRegistrationGroupIdAndStudentId(
                        registrationWindow.registrationGroupId(),
                        studentId
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Student is not assigned to the selected registration group."
                ));
        RegistrationGroup registrationGroup = assignment.getRegistrationGroup();

        Set<Long> groupSubTermIds = registrationGroup.getTerm().getAcademicSubTerms().stream()
                .map(subTerm -> subTerm == null ? null : subTerm.getId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Long sectionSubTermId = section.getSubTerm() == null ? null : section.getSubTerm().getId();
        if (!groupSubTermIds.contains(sectionSubTermId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course section does not belong to the student's registration group term."
            );
        }

        Long groupAcademicYearId = registrationGroup.getAcademicYear() == null
                ? null
                : registrationGroup.getAcademicYear().getId();
        Long sectionAcademicYearId = section.getCourseOffering() == null
                || section.getCourseOffering().getAcademicYear() == null
                ? null
                : section.getCourseOffering().getAcademicYear().getId();
        if (groupAcademicYearId != null
                && sectionAcademicYearId != null
                && !groupAcademicYearId.equals(sectionAcademicYearId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course section does not belong to the student's registration group academic year."
            );
        }

        return registrationGroup;
    }

    private void validateSectionAvailable(CourseSection section) {
        String statusCode = section.getStatus() == null ? null : normalizeCode(section.getStatus().getCode());
        if (!STUDENT_REGISTRATION_SECTION_STATUSES.contains(statusCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course section is not available for student registration."
            );
        }
    }

    private void validateNotAlreadySelected(Long studentId, Long registrationGroupId, Long sectionId) {
        if (selectionRepository.existsByStudentIdAndSectionId(studentId, sectionId)
                || selectionRepository.existsByStudentIdAndRegistrationGroupIdAndSectionId(
                studentId,
                registrationGroupId,
                sectionId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Course section has already been pre-registered."
            );
        }
    }

    private void validateNotAlreadyEnrolled(Long studentId, Long sectionId) {
        if (enrollmentRepository.existsActiveBySectionIdAndStudentId(sectionId, studentId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Student is already assigned to this section."
            );
        }
    }

    private void validateNotAlreadyRegisteredForCourse(
            Long studentId,
            RegistrationGroup registrationGroup,
            CourseSection section
    ) {
        duplicateRegistrationService.findDuplicateForRegistrationGroup(studentId, registrationGroup, section)
                .ifPresent(duplicate -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, duplicate.message());
                });
    }

    private void validateAcademicCareerAllowsSection(Long studentId, CourseSection section) {
        AcademicDivision academicDivision = section.getAcademicDivision();
        String academicDivisionCode = academicDivision == null ? null : academicDivision.getCode();
        academicCareerEligibilityService.validateCanRegisterForAcademicDivision(studentId, academicDivisionCode);
    }

    private void validateHonorsAllowsSection(Long studentId, CourseSection section) {
        if (!section.isHonors()) {
            return;
        }

        boolean honorsStudent = studentHonorsRepository.findForStudent(studentId)
                .map(honors -> honors.isActive())
                .orElse(false);
        if (!honorsStudent) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only honors students may register for honors sections."
            );
        }
    }

    private String findHonorsWarningMessage(Long studentId, CourseSection section) {
        if (section == null || section.isHonors() || !isActiveHonorsStudent(studentId)) {
            return null;
        }
        CourseOffering courseOffering = section.getCourseOffering();
        AcademicSubTerm subTerm = section.getSubTerm();
        if (courseOffering == null
                || courseOffering.getId() == null
                || subTerm == null
                || subTerm.getId() == null
                || section.getId() == null) {
            return null;
        }

        boolean honorsSectionAvailable =
                courseSectionRepository.existsPlannedHonorsSectionForOfferingAndSubTermExcludingSection(
                        courseOffering.getId(),
                        subTerm.getId(),
                        section.getId()
                );

        return honorsSectionAvailable
                ? "An honors section is available for this course."
                : null;
    }

    private boolean isActiveHonorsStudent(Long studentId) {
        return studentHonorsRepository.findForStudent(studentId)
                .map(honors -> honors.isActive())
                .orElse(false);
    }

    private GradingBasis resolveSelectedGradingBasis(
            AddStudentCourseRegistrationSelectionRequest request,
            CourseSection section
    ) {
        GradingBasis gradingBasis;
        if (request.gradingBasisId() != null) {
            gradingBasis = gradingBasisRepository.findById(request.gradingBasisId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Selected grading basis was not found."
                    ));
            String requestCode = trimToNull(request.gradingBasisCode());
            if (requestCode != null && !requestCode.equalsIgnoreCase(gradingBasis.getCode())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selected grading basis id and code do not match."
                );
            }
        } else if (trimToNull(request.gradingBasisCode()) != null) {
            gradingBasis = gradingBasisRepository.findByCodeIgnoreCase(request.gradingBasisCode().trim())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Selected grading basis was not found."
                    ));
        } else {
            gradingBasis = section.getGradingBasis();
        }

        if (gradingBasis == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected grading basis is required.");
        }
        if (!gradingBasis.isActive() || !gradingBasis.isAllowedForStudentEnrollments()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected grading basis is not available for student registration."
            );
        }

        return gradingBasis;
    }

    private BigDecimal resolveSelectedCredits(
            AddStudentCourseRegistrationSelectionRequest request,
            CourseSection section
    ) {
        BigDecimal selectedCredits = request.selectedCredits() == null
                ? section.getCredits()
                : request.selectedCredits();
        if (selectedCredits == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected credits are required.");
        }
        if (selectedCredits.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected credits cannot be negative.");
        }

        CourseVersion courseVersion = section.getCourseOffering() == null
                ? null
                : section.getCourseOffering().getCourseVersion();
        if (courseVersion == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course section is not linked to a course version."
            );
        }

        if (courseVersion.isVariableCredit()) {
            if (selectedCredits.compareTo(courseVersion.getMinCredits()) < 0
                    || selectedCredits.compareTo(courseVersion.getMaxCredits()) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selected credits must be within the course version credit range."
                );
            }
        } else if (section.getCredits() != null && selectedCredits.compareTo(section.getCredits()) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected credits must match the section credits."
            );
        }

        return selectedCredits;
    }

    private void attachSectionAssociations(
            List<StudentCourseRegistrationSelection> selections,
            List<StudentSectionEnrollment> enrollments
    ) {
        List<CourseSection> sections = new ArrayList<>();
        selections.stream()
                .map(StudentCourseRegistrationSelection::getCourseSection)
                .filter(Objects::nonNull)
                .forEach(sections::add);
        enrollments.stream()
                .map(StudentSectionEnrollment::getCourseSection)
                .filter(Objects::nonNull)
                .forEach(sections::add);
        Map<Long, CourseSection> sectionsById = sections.stream()
                .filter(section -> section.getId() != null)
                .collect(Collectors.toMap(
                        CourseSection::getId,
                        section -> section,
                        (first, ignored) -> first
                ));

        if (sectionsById.isEmpty()) {
            return;
        }

        List<Long> sectionIds = List.copyOf(sectionsById.keySet());
        Map<Long, List<CourseSectionInstructor>> instructorsBySectionId =
                courseSectionInstructorRepository.findAllByCourseSectionIdIn(sectionIds).stream()
                        .collect(Collectors.groupingBy(instructor -> instructor.getCourseSection().getId()));
        Map<Long, List<CourseSectionMeeting>> meetingsBySectionId =
                courseSectionMeetingRepository.findAllByCourseSectionIdIn(sectionIds).stream()
                        .collect(Collectors.groupingBy(meeting -> meeting.getCourseSection().getId()));

        sectionsById.forEach((sectionId, section) -> {
            section.setInstructors(instructorsBySectionId.getOrDefault(sectionId, List.of()));
            section.setMeetings(meetingsBySectionId.getOrDefault(sectionId, List.of()));
        });
    }

    private Map<Long, StudentSectionWaitlistOffer> findLatestWaitlistOffers(
            List<StudentSectionEnrollment> enrollments
    ) {
        List<Long> enrollmentIds = enrollments.stream()
                .map(StudentSectionEnrollment::getId)
                .filter(Objects::nonNull)
                .toList();
        if (enrollmentIds.isEmpty()) {
            return Map.of();
        }

        return waitlistOfferRepository.findByStudentSectionEnrollmentIdInOrderByCreatedAtDesc(enrollmentIds)
                .stream()
                .filter(offer -> offer.getStudentSectionEnrollment() != null)
                .collect(Collectors.toMap(
                        offer -> offer.getStudentSectionEnrollment().getId(),
                        offer -> offer,
                        (existing, ignored) -> existing
                ));
    }

    private Map<Long, EnrollmentCounts> findEnrollmentCountsBySectionId(
            List<StudentCourseRegistrationSelection> selections,
            List<StudentSectionEnrollment> enrollments
    ) {
        List<Long> sectionIds = new ArrayList<>();
        selections.stream()
                .map(StudentCourseRegistrationSelection::getCourseSection)
                .map(this::sectionId)
                .filter(Objects::nonNull)
                .forEach(sectionIds::add);
        enrollments.stream()
                .map(StudentSectionEnrollment::getCourseSection)
                .map(this::sectionId)
                .filter(Objects::nonNull)
                .forEach(sectionIds::add);
        List<Long> distinctSectionIds = sectionIds.stream().distinct().toList();
        if (distinctSectionIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, EnrollmentCounts> countsBySectionId = new HashMap<>();
        enrollmentRepository.countActiveEnrollmentsBySectionIds(distinctSectionIds).forEach(projection -> {
            EnrollmentCounts counts = countsBySectionId.computeIfAbsent(
                    projection.getSectionId(),
                    ignored -> new EnrollmentCounts()
            );
            counts.add(projection.getStatusCode(), projection.getEnrollmentCount());
        });

        return countsBySectionId;
    }

    private Set<Long> findSelectedCourseIdsForRegistrationGroup(Long studentId, Long registrationGroupId) {
        return findSelectedCourseIds(selectionRepository.findSelectionsForStudentAndGroup(studentId, registrationGroupId));
    }

    private Set<Long> findSelectedCourseIds(List<StudentCourseRegistrationSelection> selections) {
        return selections.stream()
                .map(StudentCourseRegistrationSelection::getCourseSection)
                .map(this::courseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private List<String> findCorequisiteWarnings(
            Long studentId,
            StudentCourseRegistrationSelection selection,
            Set<Long> selectedCourseIds
    ) {
        Long courseVersionId = courseVersionId(selection.getCourseSection());
        if (courseVersionId == null) {
            return List.of();
        }

        return requisiteValidationService.findCorequisiteWarnings(
                studentId,
                courseVersionId,
                selectedCourseIds
        );
    }

    private List<StudentCourseRegistrationRequisiteResponse> findRequisites(
            Long studentId,
            CourseSection section,
            List<StudentCoursePlannedPrerequisiteEvidence> plannedPrerequisiteEvidence
    ) {
        Long courseVersionId = courseVersionId(section);
        if (courseVersionId == null) {
            return List.of();
        }

        return requisiteDisplayService.findRequisitesForStudentCourseVersion(
                studentId,
                courseVersionId,
                section,
                plannedPrerequisiteEvidence
        );
    }

    private List<StudentCourseRegistrationRequisiteGroupResponse> findRequisiteGroups(
            Long studentId,
            CourseSection section,
            List<StudentCoursePlannedPrerequisiteEvidence> plannedPrerequisiteEvidence
    ) {
        Long courseVersionId = courseVersionId(section);
        if (courseVersionId == null) {
            return List.of();
        }

        return requisiteDisplayService.findRequisiteGroupsForStudentCourseVersion(
                studentId,
                courseVersionId,
                section,
                plannedPrerequisiteEvidence
        );
    }

    private Long sectionId(CourseSection section) {
        return section == null ? null : section.getId();
    }

    private Long courseId(CourseSection section) {
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();

        return course == null ? null : course.getId();
    }

    private Long courseVersionId(CourseSection section) {
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();

        return courseVersion == null ? null : courseVersion.getId();
    }

    private String displayName(Student student) {
        String preferredName = trimToNull(student.getPreferredName());
        String firstName = preferredName == null ? trimToNull(student.getFirstName()) : preferredName;
        String lastName = trimToNull(student.getLastName());
        String name = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();

        return name.isBlank() ? student.getEmail() : name;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private String normalizeCode(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String displaySectionCode(CourseSection section) {
        if (section == null) {
            return null;
        }

        return section.getSectionLetter() == null ? "" : section.getSectionLetter().trim();
    }

    private LocalDate subTermStartDate(CourseSection section) {
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        return subTerm == null ? null : subTerm.getStartDate();
    }

    private LocalDate subTermEndDate(CourseSection section) {
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        return subTerm == null ? null : subTerm.getEndDate();
    }

    private String courseCode(CourseSection section) {
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        if (course == null) {
            return null;
        }

        AcademicSubject subject = course.getSubject();
        if (subject == null || subject.getCode() == null) {
            return course.getCourseNumber();
        }

        return subject.getCode() + " " + course.getCourseNumber();
    }

    private record RegistrationAttemptResult(
            Long registeredEnrollmentId,
            Long waitlistedEnrollmentId,
            StudentCourseRegistrationFailureResponse failure
    ) {
        static RegistrationAttemptResult registeredResult(Long enrollmentId) {
            return new RegistrationAttemptResult(enrollmentId, null, null);
        }

        static RegistrationAttemptResult waitlistedResult(Long enrollmentId) {
            return new RegistrationAttemptResult(null, enrollmentId, null);
        }

        static RegistrationAttemptResult failure(StudentCourseRegistrationFailureResponse failure) {
            return new RegistrationAttemptResult(null, null, failure);
        }
    }

    private static final class KnownRegistrationFailureException extends RuntimeException {
        private final String failureCode;
        private final boolean retryable;

        KnownRegistrationFailureException(
                String failureCode,
                String message,
                boolean retryable
        ) {
            super(message);
            this.failureCode = failureCode;
            this.retryable = retryable;
        }

        String failureCode() {
            return failureCode;
        }

        boolean retryable() {
            return retryable;
        }
    }

    private static final class EnrollmentCounts {
        private static final EnrollmentCounts EMPTY = new EnrollmentCounts();

        private long registered;
        private long waitlisted;
        private long inProgress;

        void add(String statusCode, long count) {
            String normalizedStatus = statusCode == null ? null : statusCode.trim().toUpperCase(Locale.ROOT);
            if ("WAITLISTED".equals(normalizedStatus)) {
                waitlisted += count;
            } else if ("IN_PROGRESS".equals(normalizedStatus)) {
                inProgress += count;
            } else if ("REGISTERED".equals(normalizedStatus)) {
                registered += count;
            }
        }

        int enrolledCount() {
            return Math.toIntExact(registered + inProgress);
        }

        int waitlistCount() {
            return Math.toIntExact(waitlisted);
        }
    }
}
