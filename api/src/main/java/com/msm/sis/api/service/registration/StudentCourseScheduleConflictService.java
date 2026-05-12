package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationScheduleConflictMeetingResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationScheduleConflictResponse;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.StudentCourseRegistrationSelection;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.exception.StudentCourseRegistrationScheduleConflictException;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.StudentCourseRegistrationSelectionRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentCourseScheduleConflictService {
    public static final String CONFLICT_SOURCE_ENROLLMENT = "ENROLLMENT";
    public static final String CONFLICT_SOURCE_PRE_REGISTERED = "PRE_REGISTERED";

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a", Locale.US);

    private final CourseSectionMeetingRepository meetingRepository;
    private final StudentCourseRegistrationSelectionRepository selectionRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public void assertNoConflicts(
            Long studentId,
            RegistrationGroup registrationGroup,
            CourseSection targetSection
    ) {
        List<StudentCourseRegistrationScheduleConflictResponse> conflicts = findConflicts(
                studentId,
                registrationGroup,
                targetSection
        );

        if (!conflicts.isEmpty()) {
            throw new StudentCourseRegistrationScheduleConflictException(buildConflictMessage(conflicts), conflicts);
        }
    }

    @Transactional(readOnly = true)
    public List<StudentCourseRegistrationScheduleConflictResponse> findConflicts(
            Long studentId,
            RegistrationGroup registrationGroup,
            CourseSection targetSection
    ) {
        if (studentId == null || registrationGroup == null || targetSection == null || targetSection.getId() == null) {
            return List.of();
        }

        AcademicTerm term = registrationGroup.getTerm();
        if (term == null || term.getId() == null) {
            return List.of();
        }

        List<ConflictCandidate> candidates = loadConflictCandidates(
                studentId,
                registrationGroup.getId(),
                term.getId(),
                targetSection.getId()
        );
        if (candidates.isEmpty()) {
            return List.of();
        }

        Map<Long, List<CourseSectionMeeting>> meetingsBySectionId = loadMeetingsBySectionId(targetSection, candidates);
        List<CourseSectionMeeting> targetMeetings = meetingsBySectionId.getOrDefault(targetSection.getId(), List.of());
        if (targetMeetings.isEmpty()) {
            return List.of();
        }

        return findConflictsForTarget(targetSection, candidates, meetingsBySectionId);
    }

    @Transactional(readOnly = true)
    public Map<Long, List<StudentCourseRegistrationScheduleConflictResponse>> findRegistrationConflictsBySectionId(
            Long studentId,
            RegistrationGroup registrationGroup,
            List<CourseSection> selectedSections
    ) {
        if (studentId == null || registrationGroup == null || selectedSections == null || selectedSections.isEmpty()) {
            return Map.of();
        }

        AcademicTerm term = registrationGroup.getTerm();
        if (term == null || term.getId() == null) {
            return Map.of();
        }

        List<CourseSection> distinctSelectedSections = selectedSections.stream()
                .filter(section -> section != null && section.getId() != null)
                .collect(Collectors.toMap(
                        CourseSection::getId,
                        section -> section,
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .toList();
        if (distinctSelectedSections.isEmpty()) {
            return Map.of();
        }

        List<ConflictCandidate> enrollmentCandidates =
                enrollmentRepository.findScheduleConflictEnrollmentsForStudentAndTerm(
                                studentId,
                                term.getId(),
                                null
                        )
                        .stream()
                        .map(StudentSectionEnrollment::getCourseSection)
                        .map(section -> new ConflictCandidate(section, CONFLICT_SOURCE_ENROLLMENT))
                        .toList();
        List<ConflictCandidate> allCandidates = new ArrayList<>(enrollmentCandidates);
        distinctSelectedSections.stream()
                .map(section -> new ConflictCandidate(section, CONFLICT_SOURCE_PRE_REGISTERED))
                .forEach(allCandidates::add);

        Map<Long, List<CourseSectionMeeting>> meetingsBySectionId = loadMeetingsBySectionId(
                distinctSelectedSections,
                allCandidates
        );
        Map<Long, List<StudentCourseRegistrationScheduleConflictResponse>> conflictsBySectionId =
                new LinkedHashMap<>();

        for (CourseSection targetSection : distinctSelectedSections) {
            List<ConflictCandidate> candidates = allCandidates.stream()
                    .filter(candidate -> candidate.section() != null && candidate.section().getId() != null)
                    .filter(candidate -> !candidate.section().getId().equals(targetSection.getId()))
                    .toList();
            List<StudentCourseRegistrationScheduleConflictResponse> conflicts = findConflictsForTarget(
                    targetSection,
                    candidates,
                    meetingsBySectionId
            );
            if (!conflicts.isEmpty()) {
                conflictsBySectionId.put(targetSection.getId(), conflicts);
            }
        }

        return conflictsBySectionId;
    }

    @Transactional(readOnly = true)
    public boolean hasConflicts(Long studentId, RegistrationGroup registrationGroup, CourseSection targetSection) {
        return !findConflicts(studentId, registrationGroup, targetSection).isEmpty();
    }

    private List<ConflictCandidate> loadConflictCandidates(
            Long studentId,
            Long registrationGroupId,
            Long termId,
            Long targetSectionId
    ) {
        List<ConflictCandidate> candidates = new ArrayList<>();

        selectionRepository.findScheduleConflictSelectionsForStudentAndGroup(
                        studentId,
                        registrationGroupId,
                        targetSectionId
                )
                .stream()
                .map(StudentCourseRegistrationSelection::getCourseSection)
                .map(section -> new ConflictCandidate(section, CONFLICT_SOURCE_PRE_REGISTERED))
                .forEach(candidates::add);

        enrollmentRepository.findScheduleConflictEnrollmentsForStudentAndTerm(
                        studentId,
                        termId,
                        targetSectionId
                )
                .stream()
                .map(StudentSectionEnrollment::getCourseSection)
                .map(section -> new ConflictCandidate(section, CONFLICT_SOURCE_ENROLLMENT))
                .forEach(candidates::add);

        return candidates;
    }

    private Map<Long, List<CourseSectionMeeting>> loadMeetingsBySectionId(
            CourseSection targetSection,
            List<ConflictCandidate> candidates
    ) {
        return loadMeetingsBySectionId(List.of(targetSection), candidates);
    }

    private Map<Long, List<CourseSectionMeeting>> loadMeetingsBySectionId(
            List<CourseSection> targetSections,
            List<ConflictCandidate> candidates
    ) {
        List<Long> sectionIds = new ArrayList<>();
        targetSections.stream()
                .map(CourseSection::getId)
                .filter(Objects::nonNull)
                .forEach(sectionIds::add);
        candidates.stream()
                .map(ConflictCandidate::section)
                .map(CourseSection::getId)
                .filter(Objects::nonNull)
                .forEach(sectionIds::add);
        List<Long> distinctSectionIds = sectionIds.stream().distinct().toList();
        if (distinctSectionIds.isEmpty()) {
            return Map.of();
        }

        return meetingRepository.findScheduleConflictMeetingsBySectionIds(distinctSectionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        meeting -> meeting.getCourseSection().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private List<StudentCourseRegistrationScheduleConflictResponse> findConflictsForTarget(
            CourseSection targetSection,
            List<ConflictCandidate> candidates,
            Map<Long, List<CourseSectionMeeting>> meetingsBySectionId
    ) {
        List<CourseSectionMeeting> targetMeetings = meetingsBySectionId.getOrDefault(targetSection.getId(), List.of());
        if (targetMeetings.isEmpty()) {
            return List.of();
        }

        Map<ConflictKey, ConflictAccumulator> conflictsByKey = new LinkedHashMap<>();
        for (ConflictCandidate candidate : candidates) {
            if (candidate.section() == null || candidate.section().getId() == null) {
                continue;
            }
            List<CourseSectionMeeting> candidateMeetings =
                    meetingsBySectionId.getOrDefault(candidate.section().getId(), List.of());
            if (candidateMeetings.isEmpty()) {
                continue;
            }

            for (CourseSectionMeeting proposedMeeting : targetMeetings) {
                for (CourseSectionMeeting conflictingMeeting : candidateMeetings) {
                    if (!meetingsOverlap(targetSection, proposedMeeting, candidate.section(), conflictingMeeting)) {
                        continue;
                    }

                    ConflictKey key = new ConflictKey(candidate.section().getId(), candidate.source());
                    ConflictAccumulator accumulator = conflictsByKey.computeIfAbsent(
                            key,
                            ignored -> new ConflictAccumulator(
                                    targetSection,
                                    candidate.section(),
                                    candidate.source(),
                                    new ArrayList<>()
                            )
                    );
                    StudentCourseRegistrationScheduleConflictMeetingResponse meeting =
                            new StudentCourseRegistrationScheduleConflictMeetingResponse(
                                    proposedMeeting.getDayOfWeek(),
                                    proposedMeeting.getStartTime(),
                                    proposedMeeting.getEndTime(),
                                    conflictingMeeting.getStartTime(),
                                    conflictingMeeting.getEndTime()
                            );
                    if (!accumulator.meetings().contains(meeting)) {
                        accumulator.meetings().add(meeting);
                    }
                }
            }
        }

        return conflictsByKey.values().stream()
                .map(this::toConflictResponse)
                .sorted(Comparator
                        .comparing(StudentCourseRegistrationScheduleConflictResponse::conflictingCourseCode, nullSafeStringComparator())
                        .thenComparing(StudentCourseRegistrationScheduleConflictResponse::conflictingSectionCode, nullSafeStringComparator())
                        .thenComparing(StudentCourseRegistrationScheduleConflictResponse::conflictSource, nullSafeStringComparator())
                        .thenComparing(StudentCourseRegistrationScheduleConflictResponse::conflictingSectionId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    private boolean meetingsOverlap(
            CourseSection proposedSection,
            CourseSectionMeeting proposedMeeting,
            CourseSection conflictingSection,
            CourseSectionMeeting conflictingMeeting
    ) {
        // POC rule: a blocking conflict needs overlapping effective dates, same day, and overlapping times.
        // Sections with no meetings never reach this check, and waitlisted/dropped/cancelled enrollments are not candidates.
        if (proposedMeeting.getDayOfWeek() == null
                || conflictingMeeting.getDayOfWeek() == null
                || !proposedMeeting.getDayOfWeek().equals(conflictingMeeting.getDayOfWeek())) {
            return false;
        }

        if (!timesOverlap(
                proposedMeeting.getStartTime(),
                proposedMeeting.getEndTime(),
                conflictingMeeting.getStartTime(),
                conflictingMeeting.getEndTime()
        )) {
            return false;
        }

        return datesOverlap(
                effectiveDateRange(proposedSection, proposedMeeting),
                effectiveDateRange(conflictingSection, conflictingMeeting)
        );
    }

    private boolean timesOverlap(
            LocalTime proposedStart,
            LocalTime proposedEnd,
            LocalTime conflictingStart,
            LocalTime conflictingEnd
    ) {
        if (proposedStart == null || proposedEnd == null || conflictingStart == null || conflictingEnd == null) {
            return false;
        }

        return proposedStart.isBefore(conflictingEnd) && proposedEnd.isAfter(conflictingStart);
    }

    private DateRange effectiveDateRange(CourseSection section, CourseSectionMeeting meeting) {
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        LocalDate startDate = firstNonNull(
                meeting.getStartDate(),
                section == null ? null : section.getStartDate(),
                subTerm == null ? null : subTerm.getStartDate()
        );
        LocalDate endDate = firstNonNull(
                meeting.getEndDate(),
                section == null ? null : section.getEndDate(),
                subTerm == null ? null : subTerm.getEndDate()
        );

        return new DateRange(startDate, endDate);
    }

    private LocalDate firstNonNull(LocalDate... dates) {
        for (LocalDate date : dates) {
            if (date != null) {
                return date;
            }
        }

        return null;
    }

    private boolean datesOverlap(DateRange proposed, DateRange conflicting) {
        if (proposed.startDate() == null
                || proposed.endDate() == null
                || conflicting.startDate() == null
                || conflicting.endDate() == null) {
            return true;
        }

        return !proposed.startDate().isAfter(conflicting.endDate())
                && !proposed.endDate().isBefore(conflicting.startDate());
    }

    private StudentCourseRegistrationScheduleConflictResponse toConflictResponse(
            ConflictAccumulator accumulator
    ) {
        CourseSection proposedSection = accumulator.proposedSection();
        CourseSection conflictingSection = accumulator.conflictingSection();
        AcademicSubTerm proposedSubTerm = proposedSection.getSubTerm();
        AcademicSubTerm conflictingSubTerm = conflictingSection.getSubTerm();

        return new StudentCourseRegistrationScheduleConflictResponse(
                courseId(proposedSection),
                proposedSection.getId(),
                courseCode(proposedSection),
                displaySectionCode(proposedSection),
                proposedSubTerm == null ? null : proposedSubTerm.getId(),
                proposedSubTerm == null ? null : proposedSubTerm.getCode(),
                proposedSubTerm == null ? null : proposedSubTerm.getName(),
                courseId(conflictingSection),
                conflictingSection.getId(),
                courseCode(conflictingSection),
                displaySectionCode(conflictingSection),
                conflictingSubTerm == null ? null : conflictingSubTerm.getId(),
                conflictingSubTerm == null ? null : conflictingSubTerm.getCode(),
                conflictingSubTerm == null ? null : conflictingSubTerm.getName(),
                accumulator.source(),
                accumulator.meetings()
        );
    }

    public String buildConflictMessage(List<StudentCourseRegistrationScheduleConflictResponse> conflicts) {
        StudentCourseRegistrationScheduleConflictResponse firstConflict = conflicts.getFirst();
        StudentCourseRegistrationScheduleConflictMeetingResponse firstMeeting = firstConflict.meetings().getFirst();
        String suffix = conflicts.size() > 1 ? " and " + (conflicts.size() - 1) + " more conflict(s)" : "";

        return displayCourseSection(firstConflict.proposedCourseCode(), firstConflict.proposedSectionCode())
                + " conflicts with "
                + displayCourseSection(firstConflict.conflictingCourseCode(), firstConflict.conflictingSectionCode())
                + " on "
                + dayName(firstMeeting.dayOfWeek())
                + ", "
                + formatTime(firstMeeting.conflictingStartTime())
                + "-"
                + formatTime(firstMeeting.conflictingEndTime())
                + suffix
                + ".";
    }

    private Long courseId(CourseSection section) {
        Course course = course(section);
        return course == null ? null : course.getId();
    }

    private String courseCode(CourseSection section) {
        Course course = course(section);
        if (course == null) {
            return null;
        }

        if (course.getSubject() == null || course.getSubject().getCode() == null) {
            return course.getCourseNumber();
        }

        return course.getSubject().getCode() + " " + course.getCourseNumber();
    }

    private Course course(CourseSection section) {
        CourseOffering offering = section == null ? null : section.getCourseOffering();
        CourseVersion version = offering == null ? null : offering.getCourseVersion();
        return version == null ? null : version.getCourse();
    }

    private String displaySectionCode(CourseSection section) {
        String sectionLetter = section == null ? null : section.getSectionLetter();
        StringBuilder displayCode = new StringBuilder(sectionLetter == null ? "" : sectionLetter);
        if (section != null && section.isHonors()) {
            displayCode.append("H");
        }

        return displayCode.isEmpty() ? null : displayCode.toString();
    }

    private String displayCourseSection(String courseCode, String sectionCode) {
        StringBuilder display = new StringBuilder(nullSafe(courseCode, "Course"));
        if (sectionCode != null && !sectionCode.isBlank()) {
            display.append(" ").append(sectionCode);
        }

        return display.toString();
    }

    private String nullSafe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String dayName(Short dayOfWeek) {
        return switch (dayOfWeek) {
            case 1 -> "Monday";
            case 2 -> "Tuesday";
            case 3 -> "Wednesday";
            case 4 -> "Thursday";
            case 5 -> "Friday";
            case 6 -> "Saturday";
            case 7 -> "Sunday";
            default -> "Day " + dayOfWeek;
        };
    }

    private String formatTime(LocalTime time) {
        return time == null ? "unknown time" : time.format(TIME_FORMATTER);
    }

    private Comparator<String> nullSafeStringComparator() {
        return Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
    }

    private record ConflictCandidate(
            CourseSection section,
            String source
    ) {
    }

    private record ConflictKey(
            Long conflictingSectionId,
            String source
    ) {
    }

    private record ConflictAccumulator(
            CourseSection proposedSection,
            CourseSection conflictingSection,
            String source,
            List<StudentCourseRegistrationScheduleConflictMeetingResponse> meetings
    ) {
    }

    private record DateRange(
            LocalDate startDate,
            LocalDate endDate
    ) {
    }
}
