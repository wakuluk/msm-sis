package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationMeetingResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationRequisiteResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationSubTermResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationWindowResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseSectionSearchResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseSectionSearchResultResponse;
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
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
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

    @Transactional(readOnly = true)
    public StudentCourseSectionSearchResponse searchCourseSectionsForAuthenticatedStudent(
            Long userId,
            Long requestedTermId,
            List<Long> requestedSubTermIds,
            String courseCode,
            String section,
            String instructor,
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
                contextService.getRegistrationWindowForStudent(student.getId());

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

        List<CourseSection> sections =
                courseSectionRepository.findAvailableForStudentRegistrationBySubTermIds(subTermIds);
        attachAssociations(sections);

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
        Map<Long, EnrollmentCounts> enrollmentCountsBySectionId = findEnrollmentCountsBySectionId(sections);

        List<StudentCourseSectionSearchResultResponse> sortedResults = sections.stream()
                .map(sectionEntity -> toSearchResult(
                        student.getId(),
                        termId,
                        registrationWindow.termCode(),
                        registrationWindow.termName(),
                        sectionEntity,
                        selectedSectionIds,
                        plannedPrerequisiteEvidence,
                        assignedEnrollmentSectionIds,
                        enrollmentCountsBySectionId.getOrDefault(sectionEntity.getId(), EnrollmentCounts.EMPTY)
                ))
                .filter(row -> matchesCourse(row, courseCode))
                .filter(row -> matchesSection(row, section))
                .filter(row -> matchesInstructor(row, instructor))
                .filter(row -> matchesMeetingFilters(row, dayOfWeeks, startHour))
                .filter(row -> matchesTime(row, time))
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

    private StudentCourseSectionSearchResultResponse toSearchResult(
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
                unavailableReason,
                requisites,
                corequisiteWarnings,
                meetings.stream().map(this::toMeetingResponse).toList()
        );
    }

    private boolean matchesCourse(StudentCourseSectionSearchResultResponse row, String courseCode) {
        String normalizedCourseCode = trimToNull(courseCode);
        if (normalizedCourseCode == null) {
            return true;
        }

        return containsCourseCode(row.courseCode(), normalizedCourseCode)
                || containsIgnoreCase(row.courseTitle(), normalizedCourseCode)
                || containsIgnoreCase(row.sectionTitle(), normalizedCourseCode);
    }

    private boolean matchesSection(StudentCourseSectionSearchResultResponse row, String section) {
        String normalizedSection = trimToNull(section);
        if (normalizedSection == null) {
            return true;
        }

        return containsIgnoreCase(row.sectionLetter(), normalizedSection)
                || containsIgnoreCase(row.displaySectionCode(), normalizedSection)
                || containsIgnoreCase(row.sectionTitle(), normalizedSection);
    }

    private boolean matchesInstructor(StudentCourseSectionSearchResultResponse row, String instructor) {
        return containsIgnoreCase(row.instructorSummary(), instructor);
    }

    private boolean matchesTime(StudentCourseSectionSearchResultResponse row, String time) {
        return containsIgnoreCase(row.meetingSummary(), time);
    }

    private boolean matchesMeetingFilters(
            StudentCourseSectionSearchResultResponse row,
            List<Short> dayOfWeeks,
            Integer startHour
    ) {
        Set<Short> requestedDays = normalizeDayOfWeeks(dayOfWeeks);
        Integer requestedStartHour = normalizeStartHour(startHour);

        if (requestedDays.isEmpty() && requestedStartHour == null) {
            return true;
        }

        return row.meetings().stream()
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

    private Comparator<StudentCourseSectionSearchResultResponse> buildComparator(
            String sortBy,
            String sortDirection
    ) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String normalizedSortBy = normalizeSortBy(sortBy, "courseCode");

        Comparator<StudentCourseSectionSearchResultResponse> comparator = switch (normalizedSortBy) {
            case "courseCode" -> Comparator
                    .comparing(StudentCourseSectionSearchResultResponse::courseCode, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchResultResponse::displaySectionCode, nullSafeStringComparator());
            case "courseTitle" -> Comparator
                    .comparing(StudentCourseSectionSearchResultResponse::courseTitle, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchResultResponse::courseCode, nullSafeStringComparator());
            case "credits" -> Comparator
                    .comparing(StudentCourseSectionSearchResultResponse::credits, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(StudentCourseSectionSearchResultResponse::courseCode, nullSafeStringComparator());
            case "instructor" -> Comparator
                    .comparing(StudentCourseSectionSearchResultResponse::instructorSummary, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchResultResponse::courseCode, nullSafeStringComparator());
            case "section" -> Comparator
                    .comparing(StudentCourseSectionSearchResultResponse::displaySectionCode, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchResultResponse::courseCode, nullSafeStringComparator());
            case "status" -> Comparator
                    .comparing(StudentCourseSectionSearchResultResponse::statusName, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchResultResponse::courseCode, nullSafeStringComparator());
            case "time" -> Comparator
                    .comparing(StudentCourseSectionSearchResultResponse::meetingSummary, nullSafeStringComparator())
                    .thenComparing(StudentCourseSectionSearchResultResponse::courseCode, nullSafeStringComparator());
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: courseCode, courseTitle, credits, instructor, section, status, time."
            );
        };

        if (direction.isDescending()) {
            comparator = comparator.reversed();
        }

        return comparator.thenComparing(StudentCourseSectionSearchResultResponse::sectionId);
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
        StringBuilder displayCode = new StringBuilder(section.getSectionLetter() == null ? "" : section.getSectionLetter());
        if (section.isHonors()) {
            displayCode.append("H");
        }

        return displayCode.toString();
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
