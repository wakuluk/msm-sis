package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationEnrollmentResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationMeetingResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationRequisiteResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationScheduleMeetingResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationSelectionResponse;
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
import com.msm.sis.api.entity.SectionMeetingType;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.entity.StudentCourseRegistrationSelection;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionWaitlistOffer;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class StudentCourseRegistrationMapper {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    public StudentCourseRegistrationSelectionResponse toSelectionResponse(
            AcademicTerm term,
            StudentCourseRegistrationSelection selection,
            int enrolledCount,
            int waitlistCount,
            List<StudentCourseRegistrationRequisiteResponse> requisites,
            List<String> corequisiteWarnings
    ) {
        CourseSection section = selection.getCourseSection();
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        CourseSectionStatus sectionStatus = section == null ? null : section.getStatus();
        GradingBasis sectionGradingBasis = section == null ? null : section.getGradingBasis();
        GradingBasis selectedGradingBasis = selection.getSelectedGradingBasis();
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        List<CourseSectionInstructor> instructors = sortedInstructors(section);
        List<CourseSectionMeeting> meetings = sortedMeetings(section);

        return new StudentCourseRegistrationSelectionResponse(
                selection.getId(),
                section == null ? null : section.getId(),
                course == null ? null : course.getId(),
                courseVersion == null ? null : courseVersion.getId(),
                courseOffering == null ? null : courseOffering.getId(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                subTerm == null ? null : subTerm.getId(),
                subTerm == null ? null : subTerm.getCode(),
                subTerm == null ? null : subTerm.getName(),
                subTerm == null ? null : subTerm.getStartDate(),
                subTerm == null ? null : subTerm.getEndDate(),
                courseCode(course),
                courseVersion == null ? null : courseVersion.getTitle(),
                section == null ? null : section.getSectionLetter(),
                displaySectionCode(section),
                section == null ? null : section.getTitle(),
                sectionStatus == null ? null : sectionStatus.getId(),
                sectionStatus == null ? null : sectionStatus.getCode(),
                sectionStatus == null ? null : sectionStatus.getName(),
                sectionGradingBasis == null ? null : sectionGradingBasis.getId(),
                sectionGradingBasis == null ? null : sectionGradingBasis.getCode(),
                sectionGradingBasis == null ? null : sectionGradingBasis.getName(),
                selectedGradingBasis == null ? null : selectedGradingBasis.getId(),
                selectedGradingBasis == null ? null : selectedGradingBasis.getCode(),
                selectedGradingBasis == null ? null : selectedGradingBasis.getName(),
                section == null ? null : section.getCredits(),
                selection.getSelectedCredits(),
                section == null ? null : section.getCapacity(),
                section == null ? null : section.getHardCapacity(),
                section != null && section.isWaitlistAllowed(),
                enrolledCount,
                waitlistCount,
                instructorSummary(instructors),
                meetingSummary(meetings),
                roomSummary(meetings),
                section == null ? null : section.getStartDate(),
                section == null ? null : section.getEndDate(),
                selection.getCreatedAt(),
                selection.getUpdatedAt(),
                requisites == null ? List.of() : requisites,
                corequisiteWarnings == null ? List.of() : corequisiteWarnings,
                meetings.stream().map(this::toMeetingResponse).toList()
        );
    }

    public StudentCourseRegistrationEnrollmentResponse toEnrollmentResponse(
            AcademicTerm term,
            StudentSectionEnrollment enrollment
    ) {
        return toEnrollmentResponse(term, enrollment, null);
    }

    public StudentCourseRegistrationEnrollmentResponse toEnrollmentResponse(
            AcademicTerm term,
            StudentSectionEnrollment enrollment,
            StudentSectionWaitlistOffer waitlistOffer
    ) {
        return toEnrollmentResponse(term, enrollment, waitlistOffer, 0, 0, List.of());
    }

    public StudentCourseRegistrationEnrollmentResponse toEnrollmentResponse(
            AcademicTerm term,
            StudentSectionEnrollment enrollment,
            StudentSectionWaitlistOffer waitlistOffer,
            int enrolledCount,
            int waitlistCount,
            List<StudentCourseRegistrationRequisiteResponse> requisites
    ) {
        CourseSection section = enrollment.getCourseSection();
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        StudentSectionEnrollmentStatus enrollmentStatus = enrollment.getStatus();
        GradingBasis gradingBasis = enrollment.getGradingBasis();
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        List<CourseSectionInstructor> instructors = sortedInstructors(section);
        List<CourseSectionMeeting> meetings = sortedMeetings(section);

        return new StudentCourseRegistrationEnrollmentResponse(
                enrollment.getId(),
                section == null ? null : section.getId(),
                course == null ? null : course.getId(),
                courseVersion == null ? null : courseVersion.getId(),
                courseOffering == null ? null : courseOffering.getId(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                subTerm == null ? null : subTerm.getId(),
                subTerm == null ? null : subTerm.getCode(),
                subTerm == null ? null : subTerm.getName(),
                subTerm == null ? null : subTerm.getStartDate(),
                subTerm == null ? null : subTerm.getEndDate(),
                courseCode(course),
                courseVersion == null ? null : courseVersion.getTitle(),
                section == null ? null : section.getSectionLetter(),
                displaySectionCode(section),
                section == null ? null : section.getTitle(),
                enrollmentStatus == null ? null : enrollmentStatus.getId(),
                enrollmentStatus == null ? null : enrollmentStatus.getCode(),
                enrollmentStatus == null ? null : enrollmentStatus.getName(),
                gradingBasis == null ? null : gradingBasis.getId(),
                gradingBasis == null ? null : gradingBasis.getCode(),
                gradingBasis == null ? null : gradingBasis.getName(),
                enrollment.getCreditsAttempted(),
                enrollment.getCreditsEarned(),
                enrollment.getWaitlistPosition(),
                section == null ? null : section.getCapacity(),
                section == null ? null : section.getHardCapacity(),
                enrolledCount,
                waitlistCount,
                waitlistOffer == null ? null : waitlistOffer.getId(),
                waitlistOffer == null ? null : waitlistOffer.getStatus(),
                waitlistOffer == null ? null : waitlistOffer.getExpiresAt(),
                instructorSummary(instructors),
                meetingSummary(meetings),
                roomSummary(meetings),
                section == null ? null : section.getStartDate(),
                section == null ? null : section.getEndDate(),
                enrollment.getRegisteredAt(),
                enrollment.getWaitlistedAt(),
                requisites == null ? List.of() : requisites,
                meetings.stream().map(this::toMeetingResponse).toList()
        );
    }

    public List<StudentCourseRegistrationScheduleMeetingResponse> toSelectionScheduleMeetings(
            AcademicTerm term,
            StudentCourseRegistrationSelection selection
    ) {
        CourseSection section = selection.getCourseSection();

        return sortedMeetings(section).stream()
                .map(meeting -> toScheduleMeeting(
                        term,
                        section,
                        meeting,
                        "SELECTION",
                        selection.getId(),
                        "PRE_REGISTERED"
                ))
                .toList();
    }

    public List<StudentCourseRegistrationScheduleMeetingResponse> toEnrollmentScheduleMeetings(
            AcademicTerm term,
            StudentSectionEnrollment enrollment
    ) {
        CourseSection section = enrollment.getCourseSection();
        String status = isWaitlisted(enrollment) ? "WAITLISTED" : "ENROLLED";

        return sortedMeetings(section).stream()
                .map(meeting -> toScheduleMeeting(
                        term,
                        section,
                        meeting,
                        "ENROLLMENT",
                        enrollment.getId(),
                        status
                ))
                .toList();
    }

    public boolean isWaitlisted(StudentSectionEnrollment enrollment) {
        return enrollment.getStatus() != null && "WAITLISTED".equalsIgnoreCase(enrollment.getStatus().getCode());
    }

    private StudentCourseRegistrationScheduleMeetingResponse toScheduleMeeting(
            AcademicTerm term,
            CourseSection section,
            CourseSectionMeeting meeting,
            String sourceType,
            Long sourceRecordId,
            String registrationStatus
    ) {
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        String location = roomDisplay(meeting);
        String id = sourceType.toLowerCase(Locale.ROOT)
                + "-"
                + sourceRecordId
                + "-"
                + (meeting == null ? "meeting" : meeting.getId());

        return new StudentCourseRegistrationScheduleMeetingResponse(
                id,
                sourceType,
                sourceRecordId,
                registrationStatus,
                section == null ? null : section.getId(),
                course == null ? null : course.getId(),
                courseVersion == null ? null : courseVersion.getId(),
                courseOffering == null ? null : courseOffering.getId(),
                courseCode(course),
                courseVersion == null ? null : courseVersion.getTitle(),
                section == null ? null : section.getSectionLetter(),
                displaySectionCode(section),
                section == null ? null : section.getTitle(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                section == null || section.getSubTerm() == null ? null : section.getSubTerm().getId(),
                section == null || section.getSubTerm() == null ? null : section.getSubTerm().getCode(),
                section == null || section.getSubTerm() == null ? null : section.getSubTerm().getName(),
                meeting == null ? null : meeting.getId(),
                meeting == null ? null : meeting.getDayOfWeek(),
                meeting == null ? null : meeting.getStartTime(),
                meeting == null ? null : meeting.getEndTime(),
                meeting == null ? null : meeting.getBuilding(),
                meeting == null ? null : meeting.getRoom(),
                location
        );
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

    private List<CourseSectionInstructor> sortedInstructors(CourseSection section) {
        return section == null || section.getInstructors() == null
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
        return section == null || section.getMeetings() == null
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
        if (meeting == null) {
            return null;
        }

        String building = meeting.getBuilding() == null ? "" : meeting.getBuilding().trim();
        String room = meeting.getRoom() == null ? "" : meeting.getRoom().trim();
        String display = (building + " " + room).trim();

        return display.isBlank() ? null : display;
    }

    private String displaySectionCode(CourseSection section) {
        if (section == null) {
            return null;
        }

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
}
