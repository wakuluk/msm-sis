package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationMeetingResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationRequisiteGroupResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationRequisiteResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationSubTermResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationWindowResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseSectionSearchResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseSectionSearchResultResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseSectionSearchRowResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseSectionStatus;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.DeliveryMode;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.SectionMeetingType;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentCourseRegistrationSelection;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.CourseSectionRepository;
import com.msm.sis.api.repository.StudentCourseRegistrationSelectionRepository;
import com.msm.sis.api.repository.StudentHonorsRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.service.student.StudentAcademicCareerEligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.containsIgnoreCase;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;
import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class StudentCourseSectionSearchService {
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");
    private static final String HONORS_FILTER_ALL = "ALL";
    private static final String HONORS_FILTER_HONORS_ONLY = "HONORS_ONLY";
    private static final String HONORS_FILTER_NON_HONORS_ONLY = "NON_HONORS_ONLY";

    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final CourseSectionMeetingRepository courseSectionMeetingRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final StudentCourseRegistrationContextService contextService;
    private final StudentCourseRegistrationSelectionRepository selectionRepository;
    private final StudentCourseDuplicateRegistrationService duplicateRegistrationService;
    private final StudentCourseRequisiteValidationService requisiteValidationService;
    private final StudentCoursePrerequisiteEvidenceService prerequisiteEvidenceService;
    private final StudentCourseRegistrationRequisiteDisplayService requisiteDisplayService;
    private final StudentRepository studentRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;
    private final StudentAcademicCareerEligibilityService academicCareerEligibilityService;
    private final StudentHonorsRepository studentHonorsRepository;

    @Transactional(readOnly = true)
    public StudentCourseSectionSearchResponse searchCourseSectionsForAuthenticatedStudent(
            Long userId,
            Long registrationGroupId,
            Long requestedTermId,
            List<Long> requestedSubTermIds,
            String courseCode,
            String section,
            String instructor,
            String honorsFilter,
            List<Short> dayOfWeeks,
            Integer startHour,
            String time,
            Integer page,
            Integer size,
            String sortBy,
            String sortDirection
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        StudentCourseRegistrationWindowResponse registrationWindow =
                contextService.getRegistrationWindowForStudent(student.getId(), registrationGroupId, requestedTermId);

        Long termId = registrationWindow.termId();
        if (requestedTermId != null && !Objects.equals(requestedTermId, termId)) {
            return emptyResponse(page, size);
        }

        List<Long> allowedSubTermIds = registrationWindow.subTerms().stream()
                .map(StudentCourseRegistrationSubTermResponse::subTermId)
                .filter(Objects::nonNull)
                .toList();
        List<Long> subTermIds = narrowSubTermIds(allowedSubTermIds, requestedSubTermIds);
        if (subTermIds.isEmpty()) {
            return emptyResponse(page, size);
        }

        int effectivePage = page == null ? DEFAULT_PAGE : page;
        int effectiveSize = size == null ? DEFAULT_SIZE : size;
        validatePageRequest(effectivePage, effectiveSize, MAX_PAGE_SIZE);
        String normalizedHonorsFilter = normalizeHonorsFilter(honorsFilter);
        Set<String> allowedAcademicDivisionCodes = academicCareerEligibilityService
                .getAllowedAcademicDivisionCodes(student.getId());

        List<CourseSection> sections =
                courseSectionRepository.findAvailableForStudentRegistrationBySubTermIds(subTermIds).stream()
                        .filter(courseSection -> matchesAcademicCareerDivision(
                                courseSection,
                                allowedAcademicDivisionCodes
                        ))
                        .filter(courseSection -> matchesHonorsFilter(courseSection, normalizedHonorsFilter))
                        .toList();
        if (sections.isEmpty()) {
            return emptyResponse(effectivePage, effectiveSize);
        }

        attachAssociations(sections);

        Map<Long, EnrollmentCounts> enrollmentCountsBySectionId = findEnrollmentCountsBySectionId(sections);

        List<StudentCourseSectionSearchRowResponse> sortedResults = sections.stream()
                .filter(sectionEntity -> matchesCourse(sectionEntity, courseCode))
                .filter(sectionEntity -> matchesSection(sectionEntity, section))
                .filter(sectionEntity -> matchesInstructor(sectionEntity, instructor))
                .filter(sectionEntity -> matchesMeetingFilters(sectionEntity, dayOfWeeks, startHour))
                .filter(sectionEntity -> matchesTime(sectionEntity, time))
                .map(sectionEntity -> toSearchRow(
                        termId,
                        registrationWindow.termCode(),
                        registrationWindow.termName(),
                        sectionEntity,
                        enrollmentCountsBySectionId.getOrDefault(sectionEntity.getId(), EnrollmentCounts.EMPTY)
                ))
                .sorted(buildComparator(sortBy, sortDirection))
                .toList();

        long totalElements = sortedResults.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / effectiveSize);
        int fromIndex = Math.min(effectivePage * effectiveSize, sortedResults.size());
        int toIndex = Math.min(fromIndex + effectiveSize, sortedResults.size());

        return new StudentCourseSectionSearchResponse(
                effectivePage,
                effectiveSize,
                totalElements,
                totalPages,
                sortedResults.subList(fromIndex, toIndex)
        );
    }

    @Transactional(readOnly = true)
    public StudentCourseSectionSearchResultResponse getCourseSectionDetailForAuthenticatedStudent(
            Long userId,
            Long sectionId,
            Long registrationGroupId,
            Long requestedTermId
    ) {
        if (sectionId == null || sectionId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section id is required.");
        }

        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));
        StudentCourseRegistrationWindowResponse registrationWindow =
                contextService.getRegistrationWindowForStudent(student.getId(), registrationGroupId, requestedTermId);
        Long termId = registrationWindow.termId();
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course section was not found."
                ));
        validateSectionAvailableInRegistrationWindow(section, registrationWindow);
        attachAssociations(List.of(section));

        List<StudentCourseRegistrationSelection> selectedSelections = findSelectedSelections(student.getId(), termId);
        Set<Long> selectedSectionIds = selectedSelections.stream()
                .map(StudentCourseRegistrationSelection::getCourseSection)
                .filter(Objects::nonNull)
                .map(CourseSection::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
        List<StudentCoursePlannedPrerequisiteEvidence> plannedPrerequisiteEvidence =
                prerequisiteEvidenceService.toPlannedPrerequisiteEvidence(selectedSelections);
        Set<Long> assignedEnrollmentSectionIds = findAssignedEnrollmentSectionIds(student.getId(), termId);
        EnrollmentCounts enrollmentCounts = findEnrollmentCountsBySectionId(List.of(section))
                .getOrDefault(section.getId(), EnrollmentCounts.EMPTY);

        return toSectionDetailResult(
                student.getId(),
                termId,
                registrationWindow.termCode(),
                registrationWindow.termName(),
                section,
                selectedSectionIds,
                plannedPrerequisiteEvidence,
                assignedEnrollmentSectionIds,
                enrollmentCounts
        );
    }

    private StudentCourseSectionSearchResponse emptyResponse(Integer page, Integer size) {
        int effectivePage = page == null ? DEFAULT_PAGE : page;
        int effectiveSize = size == null ? DEFAULT_SIZE : size;
        validatePageRequest(effectivePage, effectiveSize, MAX_PAGE_SIZE);

        return new StudentCourseSectionSearchResponse(
                effectivePage,
                effectiveSize,
                0,
                0,
                List.of()
        );
    }

    private List<Long> narrowSubTermIds(List<Long> allowedSubTermIds, List<Long> requestedSubTermIds) {
        if (allowedSubTermIds.isEmpty()) {
            return List.of();
        }

        if (requestedSubTermIds == null || requestedSubTermIds.isEmpty()) {
            return allowedSubTermIds;
        }

        Set<Long> allowedIds = new LinkedHashSet<>(allowedSubTermIds);

        return requestedSubTermIds.stream()
                .filter(Objects::nonNull)
                .filter(subTermId -> subTermId > 0)
                .distinct()
                .filter(allowedIds::contains)
                .toList();
    }

    private void validateSectionAvailableInRegistrationWindow(
            CourseSection section,
            StudentCourseRegistrationWindowResponse registrationWindow
    ) {
        String statusCode = section.getStatus() == null ? null : section.getStatus().getCode();
        if (!"PLANNED".equalsIgnoreCase(statusCode)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Course section was not found."
            );
        }

        Long sectionSubTermId = section.getSubTerm() == null ? null : section.getSubTerm().getId();
        boolean sectionInWindow = registrationWindow.subTerms().stream()
                .anyMatch(subTerm -> Objects.equals(subTerm.subTermId(), sectionSubTermId));
        if (!sectionInWindow) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Course section was not found for the selected registration term."
            );
        }
    }

    private void attachAssociations(List<CourseSection> sections) {
        if (sections.isEmpty()) {
            return;
        }

        List<Long> sectionIds = sections.stream()
                .map(CourseSection::getId)
                .toList();
        Map<Long, List<CourseSectionInstructor>> instructorsBySectionId =
                courseSectionInstructorRepository.findAllByCourseSectionIdIn(sectionIds).stream()
                        .collect(Collectors.groupingBy(instructorEntity -> instructorEntity.getCourseSection().getId()));
        Map<Long, List<CourseSectionMeeting>> meetingsBySectionId =
                courseSectionMeetingRepository.findAllByCourseSectionIdIn(sectionIds).stream()
                        .collect(Collectors.groupingBy(meeting -> meeting.getCourseSection().getId()));

        sections.forEach(section -> {
            section.setInstructors(instructorsBySectionId.getOrDefault(section.getId(), List.of()));
            section.setMeetings(meetingsBySectionId.getOrDefault(section.getId(), List.of()));
        });
    }

    private List<StudentCourseRegistrationSelection> findSelectedSelections(Long studentId, Long termId) {
        if (termId == null) {
            return List.of();
        }

        return selectionRepository.findSelectionsForStudentAndTerm(studentId, termId);
    }

    private String normalizeHonorsFilter(String honorsFilter) {
        String normalizedFilter = trimToNull(honorsFilter);
        if (normalizedFilter == null) {
            return HONORS_FILTER_ALL;
        }

        normalizedFilter = normalizedFilter.toUpperCase(Locale.ROOT);
        return switch (normalizedFilter) {
            case HONORS_FILTER_ALL, HONORS_FILTER_HONORS_ONLY, HONORS_FILTER_NON_HONORS_ONLY -> normalizedFilter;
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Honors filter must be one of: ALL, HONORS_ONLY, NON_HONORS_ONLY."
            );
        };
    }

    private boolean matchesHonorsFilter(CourseSection section, String honorsFilter) {
        return switch (honorsFilter) {
            case HONORS_FILTER_HONORS_ONLY -> section.isHonors();
            case HONORS_FILTER_NON_HONORS_ONLY -> !section.isHonors();
            default -> true;
        };
    }

    private boolean matchesAcademicCareerDivision(
            CourseSection section,
            Set<String> allowedAcademicDivisionCodes
    ) {
        AcademicDivision academicDivision = section.getAcademicDivision();
        String academicDivisionCode = academicDivision == null ? null : academicDivision.getCode();
        if (academicDivisionCode == null) {
            return false;
        }

        return allowedAcademicDivisionCodes.contains(academicDivisionCode.toUpperCase(Locale.ROOT));
    }

    private Set<Long> findAssignedEnrollmentSectionIds(Long studentId, Long termId) {
        if (termId == null) {
            return Set.of();
        }

        return new HashSet<>(enrollmentRepository.findSectionIdsForStudentAndTerm(studentId, termId));
    }

    private Map<Long, EnrollmentCounts> findEnrollmentCountsBySectionId(List<CourseSection> sections) {
        List<Long> sectionIds = sections.stream()
                .map(CourseSection::getId)
                .filter(Objects::nonNull)
                .toList();
        if (sectionIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, EnrollmentCounts> countsBySectionId = new HashMap<>();
        enrollmentRepository.countActiveEnrollmentsBySectionIds(sectionIds).forEach(projection -> {
            EnrollmentCounts counts = countsBySectionId.computeIfAbsent(
                    projection.getSectionId(),
                    ignored -> new EnrollmentCounts()
            );
            counts.add(projection.getStatusCode(), projection.getEnrollmentCount());
        });

        return countsBySectionId;
    }

    private StudentCourseSectionSearchResultResponse toSectionDetailResult(
            Long studentId,
            Long termId,
            String termCode,
            String termName,
            CourseSection section,
            Set<Long> selectedSectionIds,
            List<StudentCoursePlannedPrerequisiteEvidence> plannedPrerequisiteEvidence,
            Set<Long> activeEnrollmentSectionIds,
            EnrollmentCounts enrollmentCounts
    ) {
        CourseOffering courseOffering = section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicDivision academicDivision = section.getAcademicDivision();
        CourseSectionStatus status = section.getStatus();
        DeliveryMode deliveryMode = section.getDeliveryMode();
        GradingBasis gradingBasis = section.getGradingBasis();
        AcademicSubTerm subTerm = section.getSubTerm();
        List<CourseSectionInstructor> instructors = sortedInstructors(section);
        List<CourseSectionMeeting> meetings = sortedMeetings(section);
        Optional<StudentCourseDuplicateRegistrationService.StudentCourseDuplicateRegistrationResult> selectedDuplicate =
                duplicateRegistrationService.findSelectedDuplicateForTerm(studentId, termId, section);
        Optional<StudentCourseDuplicateRegistrationService.StudentCourseDuplicateRegistrationResult> enrollmentDuplicate =
                duplicateRegistrationService.findActiveEnrollmentDuplicateForTerm(studentId, termId, section);
        String duplicateCourseReason = selectedDuplicate
                .or(() -> enrollmentDuplicate)
                .map(StudentCourseDuplicateRegistrationService.StudentCourseDuplicateRegistrationResult::message)
                .orElse(null);
        boolean prerequisitesSatisfied = true;
        boolean registrationEligibilitySatisfied = true;
        String registrationEligibilityMessage = null;
        boolean honorsEligibilitySatisfied = true;
        String honorsEligibilityMessage = null;
        String honorsWarningMessage = null;
        String unavailableReason = null;
        List<String> corequisiteWarnings = List.of();
        List<StudentCourseRegistrationRequisiteResponse> requisites = courseVersion == null || courseVersion.getId() == null
                ? List.of()
                : requisiteDisplayService.findRequisitesForStudentCourseVersion(
                studentId,
                courseVersion.getId(),
                section,
                plannedPrerequisiteEvidence
        );
        List<StudentCourseRegistrationRequisiteGroupResponse> requisiteGroups =
                courseVersion == null || courseVersion.getId() == null
                        ? List.of()
                        : requisiteDisplayService.findRequisiteGroupsForStudentCourseVersion(
                                studentId,
                                courseVersion.getId(),
                                section,
                                plannedPrerequisiteEvidence
                        );

        if (courseVersion != null && courseVersion.getId() != null) {
            try {
                StudentCourseRequisiteValidationResult validationResult =
                        requisiteValidationService.validateForPreRegistration(
                                studentId,
                                section,
                                plannedPrerequisiteEvidence
                        );
                corequisiteWarnings = validationResult.corequisiteWarnings();
            } catch (ResponseStatusException exception) {
                prerequisitesSatisfied = false;
                unavailableReason = exception.getReason() == null ? exception.getMessage() : exception.getReason();
            }
        }

        AcademicDivision sectionAcademicDivision = section.getAcademicDivision();
        registrationEligibilityMessage = academicCareerEligibilityService.findRegistrationEligibilityMessage(
                studentId,
                sectionAcademicDivision == null ? null : sectionAcademicDivision.getCode()
        );
        if (registrationEligibilityMessage != null) {
            registrationEligibilitySatisfied = false;
        }
        boolean honorsStudent = studentHonorsRepository.findForStudent(studentId)
                .map(honors -> honors.isActive())
                .orElse(false);
        if (section.isHonors() && !honorsStudent) {
            honorsEligibilitySatisfied = false;
            honorsEligibilityMessage = "Only honors students may register for honors sections.";
        } else if (!section.isHonors() && honorsStudent && hasPlannedHonorsSectionForSameCourse(section)) {
            honorsWarningMessage = "An honors section is available for this course.";
        }

        Integer seatsAvailable = section.getCapacity() == null
                ? null
                : Math.max(0, section.getCapacity() - enrollmentCounts.enrolledCount());

        return new StudentCourseSectionSearchResultResponse(
                section.getId(),
                course == null ? null : course.getId(),
                courseVersion == null ? null : courseVersion.getId(),
                courseOffering == null ? null : courseOffering.getId(),
                termId,
                termCode,
                termName,
                subTerm == null ? null : subTerm.getId(),
                subTerm == null ? null : subTerm.getCode(),
                subTerm == null ? null : subTerm.getName(),
                subTerm == null ? null : subTerm.getStartDate(),
                subTerm == null ? null : subTerm.getEndDate(),
                courseCode(course),
                courseVersion == null ? null : courseVersion.getTitle(),
                section.getSectionLetter(),
                displaySectionCode(section),
                section.getTitle(),
                status == null ? null : status.getId(),
                status == null ? null : status.getCode(),
                status == null ? null : status.getName(),
                academicDivision == null ? null : academicDivision.getId(),
                academicDivision == null ? null : academicDivision.getCode(),
                academicDivision == null ? null : academicDivision.getName(),
                deliveryMode == null ? null : deliveryMode.getId(),
                deliveryMode == null ? null : deliveryMode.getCode(),
                deliveryMode == null ? null : deliveryMode.getName(),
                gradingBasis == null ? null : gradingBasis.getId(),
                gradingBasis == null ? null : gradingBasis.getCode(),
                gradingBasis == null ? null : gradingBasis.getName(),
                section.getCredits(),
                section.isHonors(),
                section.getCapacity(),
                section.getHardCapacity(),
                section.isWaitlistAllowed(),
                enrollmentCounts.enrolledCount(),
                enrollmentCounts.waitlistCount(),
                seatsAvailable,
                instructorSummary(instructors),
                meetingSummary(meetings),
                roomSummary(meetings),
                section.getStartDate(),
                section.getEndDate(),
                selectedSectionIds.contains(section.getId()),
                activeEnrollmentSectionIds.contains(section.getId()),
                selectedDuplicate.isPresent(),
                enrollmentDuplicate.isPresent(),
                duplicateCourseReason,
                prerequisitesSatisfied,
                registrationEligibilitySatisfied,
                registrationEligibilityMessage,
                honorsEligibilitySatisfied,
                honorsEligibilityMessage,
                honorsWarningMessage,
                unavailableReason,
                requisites,
                requisiteGroups,
                corequisiteWarnings,
                meetings.stream().map(this::toMeetingResponse).toList()
        );
    }

    private StudentCourseSectionSearchRowResponse toSearchRow(
            Long termId,
            String termCode,
            String termName,
            CourseSection section,
            EnrollmentCounts enrollmentCounts
    ) {
        CourseOffering courseOffering = section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicDivision academicDivision = section.getAcademicDivision();
        AcademicSubTerm subTerm = section.getSubTerm();
        List<CourseSectionInstructor> instructors = sortedInstructors(section);
        List<CourseSectionMeeting> meetings = sortedMeetings(section);
        Integer seatsAvailable = section.getCapacity() == null
                ? null
                : Math.max(0, section.getCapacity() - enrollmentCounts.enrolledCount());

        return new StudentCourseSectionSearchRowResponse(
                section.getId(),
                course == null ? null : course.getId(),
                courseVersion == null ? null : courseVersion.getId(),
                courseOffering == null ? null : courseOffering.getId(),
                termId,
                termCode,
                termName,
                subTerm == null ? null : subTerm.getId(),
                subTerm == null ? null : subTerm.getCode(),
                subTerm == null ? null : subTerm.getName(),
                subTerm == null ? null : subTerm.getStartDate(),
                subTerm == null ? null : subTerm.getEndDate(),
                courseCode(course),
                courseVersion == null ? null : courseVersion.getTitle(),
                section.getSectionLetter(),
                displaySectionCode(section),
                academicDivision == null ? null : academicDivision.getId(),
                academicDivision == null ? null : academicDivision.getCode(),
                academicDivision == null ? null : academicDivision.getName(),
                section.getCredits(),
                section.isHonors(),
                section.getCapacity(),
                section.getHardCapacity(),
                enrollmentCounts.enrolledCount(),
                enrollmentCounts.waitlistCount(),
                seatsAvailable,
                instructorSummary(instructors),
                meetingSummary(meetings)
        );
    }

    private boolean matchesCourse(CourseSection section, String courseCode) {
        String normalizedCourseCode = trimToNull(courseCode);
        if (normalizedCourseCode == null) {
            return true;
        }

        CourseOffering courseOffering = section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();

        return containsCourseCode(courseCode(course), normalizedCourseCode)
                || containsIgnoreCase(courseVersion == null ? null : courseVersion.getTitle(), normalizedCourseCode)
                || containsIgnoreCase(section.getTitle(), normalizedCourseCode);
    }

    private boolean matchesSection(CourseSection courseSection, String section) {
        String normalizedSection = trimToNull(section);
        if (normalizedSection == null) {
            return true;
        }

        return containsIgnoreCase(courseSection.getSectionLetter(), normalizedSection)
                || containsIgnoreCase(displaySectionCode(courseSection), normalizedSection)
                || containsIgnoreCase(courseSection.getTitle(), normalizedSection);
    }

    private boolean matchesInstructor(CourseSection section, String instructor) {
        return containsIgnoreCase(instructorSummary(sortedInstructors(section)), instructor);
    }

    private boolean hasPlannedHonorsSectionForSameCourse(CourseSection section) {
        CourseOffering courseOffering = section.getCourseOffering();
        AcademicSubTerm subTerm = section.getSubTerm();
        if (courseOffering == null
                || courseOffering.getId() == null
                || subTerm == null
                || subTerm.getId() == null
                || section.getId() == null) {
            return false;
        }

        return courseSectionRepository.existsPlannedHonorsSectionForOfferingAndSubTermExcludingSection(
                courseOffering.getId(),
                subTerm.getId(),
                section.getId()
        );
    }

    private boolean matchesTime(CourseSection section, String time) {
        return containsIgnoreCase(meetingSummary(sortedMeetings(section)), time);
    }

    private boolean matchesMeetingFilters(
            CourseSection section,
            List<Short> dayOfWeeks,
            Integer startHour
    ) {
        Set<Short> requestedDays = normalizeDayOfWeeks(dayOfWeeks);
        Integer requestedStartHour = normalizeStartHour(startHour);

        if (requestedDays.isEmpty() && requestedStartHour == null) {
            return true;
        }

        return sortedMeetings(section).stream()
                .map(this::toMeetingResponse)
                .anyMatch(meeting -> matchesMeetingFilter(meeting, requestedDays, requestedStartHour));
    }

    private boolean matchesMeetingFilter(
            StudentCourseRegistrationMeetingResponse meeting,
            Set<Short> requestedDays,
            Integer requestedStartHour
    ) {
        if (!requestedDays.isEmpty() && !requestedDays.contains(meeting.dayOfWeek())) {
            return false;
        }

        return requestedStartHour == null
                || meeting.startTime() != null && meeting.startTime().getHour() == requestedStartHour;
    }

    private Set<Short> normalizeDayOfWeeks(List<Short> dayOfWeeks) {
        if (dayOfWeeks == null || dayOfWeeks.isEmpty()) {
            return Set.of();
        }

        return dayOfWeeks.stream()
                .filter(Objects::nonNull)
                .filter(dayOfWeek -> dayOfWeek >= 1 && dayOfWeek <= 7)
                .collect(Collectors.toSet());
    }

    private Integer normalizeStartHour(Integer startHour) {
        if (startHour == null || startHour < 0 || startHour > 23) {
            return null;
        }

        return startHour;
    }

    private boolean containsCourseCode(String courseCode, String filter) {
        if (courseCode == null) {
            return false;
        }

        String normalizedCourseCode = courseCode.toLowerCase(Locale.ROOT).replace(" ", "");
        String normalizedFilter = filter.toLowerCase(Locale.ROOT).replace(" ", "");

        return normalizedCourseCode.contains(normalizedFilter);
    }

    private Comparator<StudentCourseSectionSearchRowResponse> buildComparator(
            String sortBy,
            String sortDirection
    ) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String normalizedSortBy = normalizeSortBy(sortBy, "courseCode");

        Comparator<StudentCourseSectionSearchRowResponse> comparator = switch (normalizedSortBy) {
            case "courseCode" -> Comparator
                    .comparing(StudentCourseSectionSearchRowResponse::courseCode, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchRowResponse::displaySectionCode, nullSafeStringComparator());
            case "courseTitle" -> Comparator
                    .comparing(StudentCourseSectionSearchRowResponse::courseTitle, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchRowResponse::courseCode, nullSafeStringComparator());
            case "credits" -> Comparator
                    .comparing(StudentCourseSectionSearchRowResponse::credits, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(StudentCourseSectionSearchRowResponse::courseCode, nullSafeStringComparator());
            case "instructor" -> Comparator
                    .comparing(StudentCourseSectionSearchRowResponse::instructorSummary, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchRowResponse::courseCode, nullSafeStringComparator());
            case "section" -> Comparator
                    .comparing(StudentCourseSectionSearchRowResponse::displaySectionCode, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchRowResponse::courseCode, nullSafeStringComparator());
            case "time" -> Comparator
                    .comparing(StudentCourseSectionSearchRowResponse::meetingSummary, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchRowResponse::courseCode, nullSafeStringComparator());
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: courseCode, courseTitle, credits, instructor, section, time."
            );
        };

        if (direction.isDescending()) {
            comparator = comparator.reversed();
        }

        return comparator.thenComparing(StudentCourseSectionSearchRowResponse::sectionId);
    }

    private Comparator<String> nullSafeStringComparator() {
        return Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
    }

    private List<CourseSectionInstructor> sortedInstructors(CourseSection section) {
        return section.getInstructors() == null
                ? List.of()
                : section.getInstructors().stream()
                .sorted(Comparator.comparing(CourseSectionInstructor::isPrimary).reversed()
                        .thenComparing(instructor -> instructor.getRole() == null ? null : instructor.getRole().getSortOrder(), Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(instructor -> instructor.getInstructorStaff() == null ? null : instructor.getInstructorStaff().getLastName(), Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(instructor -> instructor.getInstructorStaff() == null ? null : instructor.getInstructorStaff().getFirstName(), Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(CourseSectionInstructor::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    private List<CourseSectionMeeting> sortedMeetings(CourseSection section) {
        return section.getMeetings() == null
                ? List.of()
                : section.getMeetings().stream()
                .sorted(Comparator.comparing(CourseSectionMeeting::getSequenceNumber, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(CourseSectionMeeting::getDayOfWeek, Comparator.nullsLast(Short::compareTo))
                        .thenComparing(CourseSectionMeeting::getStartTime, Comparator.nullsLast(LocalTime::compareTo))
                        .thenComparing(CourseSectionMeeting::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    private String instructorSummary(List<CourseSectionInstructor> instructors) {
        String summary = instructors.stream()
                .map(this::instructorName)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(", "));

        return summary.isBlank() ? null : summary;
    }

    private String instructorName(CourseSectionInstructor instructor) {
        Staff staff = instructor.getInstructorStaff();
        if (staff == null) {
            return instructor.getInstructorUser() == null ? null : instructor.getInstructorUser().getEmail();
        }

        String firstName = staff.getFirstName() == null ? "" : staff.getFirstName().trim();
        String lastName = staff.getLastName() == null ? "" : staff.getLastName().trim();
        String name = (firstName + " " + lastName).trim();

        return name.isBlank() ? staff.getEmail() : name;
    }

    private String meetingSummary(List<CourseSectionMeeting> meetings) {
        String summary = meetings.stream()
                .map(this::meetingDisplay)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("; "));

        return summary.isBlank() ? null : summary;
    }

    private String meetingDisplay(CourseSectionMeeting meeting) {
        String dayLabel = dayOfWeek(meeting.getDayOfWeek());
        String timeLabel = timeRange(meeting.getStartTime(), meeting.getEndTime());

        if (dayLabel == null) {
            return timeLabel;
        }

        if (timeLabel == null) {
            return dayLabel;
        }

        return dayLabel + " " + timeLabel;
    }

    private String roomSummary(List<CourseSectionMeeting> meetings) {
        String summary = meetings.stream()
                .map(this::roomDisplay)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(", "));

        return summary.isBlank() ? null : summary;
    }

    private String roomDisplay(CourseSectionMeeting meeting) {
        String building = meeting.getBuilding() == null ? "" : meeting.getBuilding().trim();
        String room = meeting.getRoom() == null ? "" : meeting.getRoom().trim();
        String display = (building + " " + room).trim();

        return display.isBlank() ? null : display;
    }

    private StudentCourseRegistrationMeetingResponse toMeetingResponse(CourseSectionMeeting meeting) {
        SectionMeetingType meetingType = meeting.getMeetingType();

        return new StudentCourseRegistrationMeetingResponse(
                meeting.getId(),
                meetingType == null ? null : meetingType.getId(),
                meetingType == null ? null : meetingType.getCode(),
                meetingType == null ? null : meetingType.getName(),
                meeting.getDayOfWeek(),
                meeting.getStartTime(),
                meeting.getEndTime(),
                meeting.getBuilding(),
                meeting.getRoom(),
                meeting.getStartDate(),
                meeting.getEndDate(),
                meeting.getSequenceNumber()
        );
    }

    private String displaySectionCode(CourseSection section) {
        return section.getSectionLetter() == null ? "" : section.getSectionLetter();
    }

    private String courseCode(Course course) {
        if (course == null) {
            return null;
        }

        AcademicSubject subject = course.getSubject();
        if (subject == null) {
            return course.getCourseNumber();
        }

        return subject.getCode() + " " + course.getCourseNumber();
    }

    private Long courseId(CourseSection section) {
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();

        return course == null ? null : course.getId();
    }

    private String dayOfWeek(Short dayOfWeek) {
        if (dayOfWeek == null) {
            return null;
        }

        return switch (dayOfWeek) {
            case 1 -> "Mon";
            case 2 -> "Tue";
            case 3 -> "Wed";
            case 4 -> "Thu";
            case 5 -> "Fri";
            case 6 -> "Sat";
            case 7 -> "Sun";
            default -> null;
        };
    }

    private String timeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime == null && endTime == null) {
            return null;
        }

        if (startTime == null) {
            return "Ends " + endTime.format(TIME_FORMATTER);
        }

        if (endTime == null) {
            return "Starts " + startTime.format(TIME_FORMATTER);
        }

        return startTime.format(TIME_FORMATTER) + "-" + endTime.format(TIME_FORMATTER);
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
