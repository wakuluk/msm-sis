package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseSectionInstructorConflictMeetingResponse;
import com.msm.sis.api.dto.course.CourseSectionInstructorConflictResponse;
import com.msm.sis.api.dto.course.CreateCourseSectionInstructorRequest;
import com.msm.sis.api.dto.course.CreateCourseSectionMeetingRequest;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.exception.CourseSectionInstructorConflictException;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CourseSectionInstructorConflictService {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a", Locale.US);

    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final StaffRepository staffRepository;

    public void assertNoConflicts(
            Long proposedSectionId,
            AcademicSubTerm proposedSubTerm,
            List<CreateCourseSectionInstructorRequest> instructorRequests,
            List<CreateCourseSectionMeetingRequest> meetingRequests
    ) {
        List<CourseSectionInstructorConflictResponse> conflicts = findConflicts(
                proposedSectionId,
                proposedSubTerm,
                instructorRequests,
                meetingRequests
        );

        if (!conflicts.isEmpty()) {
            throw new CourseSectionInstructorConflictException(buildConflictMessage(conflicts), conflicts);
        }
    }

    public List<CourseSectionInstructorConflictResponse> findConflicts(
            Long proposedSectionId,
            AcademicSubTerm proposedSubTerm,
            List<CreateCourseSectionInstructorRequest> instructorRequests,
            List<CreateCourseSectionMeetingRequest> meetingRequests
    ) {
        List<ProposedMeeting> proposedMeetings = buildProposedMeetings(proposedSubTerm, meetingRequests);

        if (proposedMeetings.isEmpty()) {
            return List.of();
        }

        List<ProposedInstructor> proposedInstructors = buildProposedInstructors(instructorRequests);

        if (proposedInstructors.isEmpty()) {
            return List.of();
        }

        Map<Long, ProposedInstructor> proposedInstructorsByUserId = proposedInstructors.stream()
                .collect(
                        LinkedHashMap::new,
                        (map, instructor) -> map.putIfAbsent(instructor.instructorUserId(), instructor),
                        Map::putAll
                );
        List<CourseSectionInstructor> existingAssignments =
                courseSectionInstructorRepository.findPotentialScheduleConflicts(
                        proposedInstructorsByUserId.keySet(),
                        proposedSectionId,
                        proposedSubTerm.getStartDate(),
                        proposedSubTerm.getEndDate()
                );
        Map<ConflictKey, ConflictAccumulator> conflictsByKey = new LinkedHashMap<>();

        for (CourseSectionInstructor existingAssignment : existingAssignments) {
            ProposedInstructor proposedInstructor = proposedInstructorsByUserId.get(
                    existingAssignment.getInstructorUser().getId()
            );

            if (proposedInstructor == null) {
                continue;
            }

            CourseSection existingSection = existingAssignment.getCourseSection();
            AcademicSubTerm existingSubTerm = existingSection.getSubTerm();
            List<ExistingMeeting> existingMeetings = buildExistingMeetings(existingSubTerm, existingSection.getMeetings());

            if (existingMeetings.isEmpty()) {
                continue;
            }

            for (ProposedMeeting proposedMeeting : proposedMeetings) {
                for (ExistingMeeting existingMeeting : existingMeetings) {
                    if (!meetingsOverlap(proposedMeeting, existingMeeting)) {
                        continue;
                    }

                    ConflictKey key = new ConflictKey(
                            proposedInstructor.staffId(),
                            proposedInstructor.instructorUserId(),
                            existingSection.getId()
                    );
                    ConflictAccumulator accumulator = conflictsByKey.computeIfAbsent(
                            key,
                            ignored -> new ConflictAccumulator(
                                    proposedInstructor,
                                    existingSection,
                                    existingSubTerm
                            )
                    );
                    accumulator.meetings().add(new CourseSectionInstructorConflictMeetingResponse(
                            proposedMeeting.dayOfWeek(),
                            proposedMeeting.startTime(),
                            proposedMeeting.endTime(),
                            existingMeeting.startTime(),
                            existingMeeting.endTime()
                    ));
                }
            }
        }

        return conflictsByKey.values().stream()
                .map(this::toConflictResponse)
                .toList();
    }

    private List<ProposedInstructor> buildProposedInstructors(
            List<CreateCourseSectionInstructorRequest> instructorRequests
    ) {
        if (instructorRequests == null || instructorRequests.isEmpty()) {
            return List.of();
        }

        List<Long> staffIds = instructorRequests.stream()
                .map(CreateCourseSectionInstructorRequest::staffId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, Staff> staffById = new LinkedHashMap<>();

        staffRepository.findAllById(staffIds).forEach(staff -> staffById.put(staff.getId(), staff));

        return staffIds.stream()
                .map(staffById::get)
                .filter(Objects::nonNull)
                .filter(staff -> staff.getUserId() != null)
                .map(staff -> new ProposedInstructor(
                        staff.getId(),
                        staff.getUserId(),
                        buildStaffName(staff)
                ))
                .toList();
    }

    private List<ProposedMeeting> buildProposedMeetings(
            AcademicSubTerm subTerm,
            List<CreateCourseSectionMeetingRequest> meetingRequests
    ) {
        if (subTerm == null || meetingRequests == null || meetingRequests.isEmpty()) {
            return List.of();
        }

        return meetingRequests.stream()
                .filter(Objects::nonNull)
                .filter(this::hasSchedulableMeetingTime)
                .map(meeting -> new ProposedMeeting(
                        meeting.dayOfWeek(),
                        meeting.startTime(),
                        meeting.endTime(),
                        effectiveStartDate(meeting.startDate(), subTerm.getStartDate()),
                        effectiveEndDate(meeting.endDate(), subTerm.getEndDate())
                ))
                .filter(ProposedMeeting::hasValidDateRange)
                .toList();
    }

    private List<ExistingMeeting> buildExistingMeetings(
            AcademicSubTerm subTerm,
            Collection<CourseSectionMeeting> meetings
    ) {
        if (subTerm == null || meetings == null || meetings.isEmpty()) {
            return List.of();
        }

        return meetings.stream()
                .filter(Objects::nonNull)
                .filter(this::hasSchedulableMeetingTime)
                .map(meeting -> new ExistingMeeting(
                        meeting.getDayOfWeek(),
                        meeting.getStartTime(),
                        meeting.getEndTime(),
                        effectiveStartDate(meeting.getStartDate(), subTerm.getStartDate()),
                        effectiveEndDate(meeting.getEndDate(), subTerm.getEndDate())
                ))
                .filter(ExistingMeeting::hasValidDateRange)
                .toList();
    }

    private boolean hasSchedulableMeetingTime(CreateCourseSectionMeetingRequest meeting) {
        return meeting.dayOfWeek() != null
                && meeting.startTime() != null
                && meeting.endTime() != null
                && meeting.startTime().isBefore(meeting.endTime());
    }

    private boolean hasSchedulableMeetingTime(CourseSectionMeeting meeting) {
        return meeting.getDayOfWeek() != null
                && meeting.getStartTime() != null
                && meeting.getEndTime() != null
                && meeting.getStartTime().isBefore(meeting.getEndTime());
    }

    private boolean meetingsOverlap(ProposedMeeting proposedMeeting, ExistingMeeting existingMeeting) {
        return proposedMeeting.dayOfWeek().equals(existingMeeting.dayOfWeek())
                && datesOverlap(
                        proposedMeeting.startDate(),
                        proposedMeeting.endDate(),
                        existingMeeting.startDate(),
                        existingMeeting.endDate()
                )
                && timesOverlap(
                        proposedMeeting.startTime(),
                        proposedMeeting.endTime(),
                        existingMeeting.startTime(),
                        existingMeeting.endTime()
                );
    }

    private boolean datesOverlap(
            LocalDate leftStart,
            LocalDate leftEnd,
            LocalDate rightStart,
            LocalDate rightEnd
    ) {
        return !leftStart.isAfter(rightEnd) && !leftEnd.isBefore(rightStart);
    }

    private boolean timesOverlap(
            LocalTime leftStart,
            LocalTime leftEnd,
            LocalTime rightStart,
            LocalTime rightEnd
    ) {
        return leftStart.isBefore(rightEnd) && leftEnd.isAfter(rightStart);
    }

    private LocalDate effectiveStartDate(LocalDate meetingStartDate, LocalDate subTermStartDate) {
        return meetingStartDate == null ? subTermStartDate : meetingStartDate;
    }

    private LocalDate effectiveEndDate(LocalDate meetingEndDate, LocalDate subTermEndDate) {
        return meetingEndDate == null ? subTermEndDate : meetingEndDate;
    }

    private CourseSectionInstructorConflictResponse toConflictResponse(ConflictAccumulator accumulator) {
        CourseSection section = accumulator.conflictingSection();
        AcademicSubTerm conflictingSubTerm = accumulator.conflictingSubTerm();
        ProposedInstructor instructor = accumulator.proposedInstructor();
        String sectionCode = buildSectionCode(section);

        return new CourseSectionInstructorConflictResponse(
                instructor.staffId(),
                instructor.instructorUserId(),
                instructor.instructorName(),
                section.getId(),
                sectionCode,
                buildSectionDisplay(sectionCode, section),
                conflictingSubTerm.getId(),
                conflictingSubTerm.getCode(),
                conflictingSubTerm.getName(),
                conflictingSubTerm.getId(),
                conflictingSubTerm.getCode(),
                conflictingSubTerm.getName(),
                List.copyOf(accumulator.meetings())
        );
    }

    private String buildConflictMessage(List<CourseSectionInstructorConflictResponse> conflicts) {
        CourseSectionInstructorConflictResponse firstConflict = conflicts.getFirst();
        CourseSectionInstructorConflictMeetingResponse firstMeeting = firstConflict.meetings().getFirst();
        String suffix = conflicts.size() > 1 ? " and " + (conflicts.size() - 1) + " more conflict(s)" : "";

        return firstConflict.instructorName()
                + " conflicts with "
                + firstConflict.conflictingSectionCode()
                + ", "
                + firstConflict.conflictingSubTermName()
                + ", "
                + dayName(firstMeeting.dayOfWeek())
                + " "
                + formatTime(firstMeeting.conflictingStartTime())
                + "-"
                + formatTime(firstMeeting.conflictingEndTime())
                + suffix
                + ".";
    }

    private String buildStaffName(Staff staff) {
        String firstName = staff.getFirstName() == null ? "" : staff.getFirstName();
        String lastName = staff.getLastName() == null ? "" : staff.getLastName();
        String name = (firstName + " " + lastName).trim();

        return name.isBlank() ? staff.getEmail() : name;
    }

    private String buildSectionCode(CourseSection section) {
        CourseVersion courseVersion = section.getCourseOffering() == null
                ? null
                : section.getCourseOffering().getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicSubject subject = course == null ? null : course.getSubject();
        String courseCode = course == null
                ? "Course"
                : (subject == null || subject.getCode() == null
                ? course.getCourseNumber()
                : subject.getCode() + " " + course.getCourseNumber());
        String honorsSuffix = section.isHonors() ? "H" : "";

        return courseCode + " " + section.getSectionLetter() + honorsSuffix;
    }

    private String buildSectionDisplay(String sectionCode, CourseSection section) {
        CourseOffering offering = section.getCourseOffering();
        CourseVersion version = offering == null ? null : offering.getCourseVersion();
        String title = version == null ? section.getTitle() : version.getTitle();

        return title == null || title.isBlank() ? sectionCode : sectionCode + " - " + title;
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
        return time.format(TIME_FORMATTER);
    }

    private record ProposedInstructor(
            Long staffId,
            Long instructorUserId,
            String instructorName
    ) {
    }

    private record ProposedMeeting(
            Short dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate startDate,
            LocalDate endDate
    ) {
        private boolean hasValidDateRange() {
            return !startDate.isAfter(endDate);
        }
    }

    private record ExistingMeeting(
            Short dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate startDate,
            LocalDate endDate
    ) {
        private boolean hasValidDateRange() {
            return !startDate.isAfter(endDate);
        }
    }

    private record ConflictKey(
            Long staffId,
            Long instructorUserId,
            Long conflictingSectionId
    ) {
    }

    private record ConflictAccumulator(
            ProposedInstructor proposedInstructor,
            CourseSection conflictingSection,
            AcademicSubTerm conflictingSubTerm,
            List<CourseSectionInstructorConflictMeetingResponse> meetings
    ) {
        private ConflictAccumulator(
                ProposedInstructor proposedInstructor,
                CourseSection conflictingSection,
                AcademicSubTerm conflictingSubTerm
        ) {
            this(proposedInstructor, conflictingSection, conflictingSubTerm, new ArrayList<>());
        }
    }
}
