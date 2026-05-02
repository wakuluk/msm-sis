package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.course.CourseSectionDetailResponse;
import com.msm.sis.api.dto.course.CourseSectionEnrollmentSummaryResponse;
import com.msm.sis.api.dto.course.CourseSectionInstructorResponse;
import com.msm.sis.api.dto.course.CourseSectionListResponse;
import com.msm.sis.api.dto.course.CourseSectionListResultResponse;
import com.msm.sis.api.dto.course.CourseSectionMeetingResponse;
import com.msm.sis.api.dto.course.PatchCourseSectionRequest;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseSectionStatus;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.DeliveryMode;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.SectionInstructorRole;
import com.msm.sis.api.entity.SectionMeetingType;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.patch.PatchValue;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import static com.msm.sis.api.patch.PatchUtils.apply;
import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class CourseSectionMapper {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    public CourseSectionListResponse toCourseSectionListResponse(
            Long courseOfferingId,
            Long subTermId,
            Page<CourseSection> courseSectionsPage
    ) {
        return new CourseSectionListResponse(
                courseOfferingId,
                subTermId,
                courseSectionsPage.getContent().stream()
                        .map(this::toCourseSectionListResultResponse)
                        .toList(),
                courseSectionsPage.getNumber(),
                courseSectionsPage.getSize(),
                courseSectionsPage.getTotalElements(),
                courseSectionsPage.getTotalPages()
        );
    }

    public CourseSectionListResultResponse toCourseSectionListResultResponse(CourseSection section) {
        CourseOffering courseOffering = section.getCourseOffering();
        AcademicDivision academicDivision = section.getAcademicDivision();
        CourseSectionStatus status = section.getStatus();
        DeliveryMode deliveryMode = section.getDeliveryMode();
        GradingBasis gradingBasis = section.getGradingBasis();
        List<CourseSectionInstructor> instructors = sortedInstructors(section);
        List<CourseSectionMeeting> meetings = sortedMeetings(section);

        return new CourseSectionListResultResponse(
                section.getId(),
                courseOffering == null ? null : courseOffering.getId(),
                section.getSubTerm() == null ? null : section.getSubTerm().getId(),
                section.getSectionLetter(),
                buildDisplaySectionCode(section),
                section.getTitle(),
                section.isHonors(),
                section.isLab(),
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
                section.getStartDate(),
                section.getEndDate(),
                buildPrimaryInstructorName(instructors),
                buildInstructorSummary(instructors),
                buildMeetingSummary(meetings),
                buildRoomSummary(meetings),
                buildEnrollmentSummary(section),
                instructors.stream().map(this::toCourseSectionInstructorResponse).toList(),
                meetings.stream().map(this::toCourseSectionMeetingResponse).toList()
        );
    }

    public CourseSectionDetailResponse toCourseSectionDetailResponse(CourseSection section) {
        CourseOffering courseOffering = section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicDivision academicDivision = section.getAcademicDivision();
        CourseSectionStatus status = section.getStatus();
        DeliveryMode deliveryMode = section.getDeliveryMode();
        GradingBasis gradingBasis = section.getGradingBasis();
        List<CourseSectionInstructor> instructors = sortedInstructors(section);
        List<CourseSectionMeeting> meetings = sortedMeetings(section);

        return new CourseSectionDetailResponse(
                section.getId(),
                courseOffering == null ? null : courseOffering.getId(),
                section.getSubTerm() == null ? null : section.getSubTerm().getId(),
                course == null ? null : course.getId(),
                courseVersion == null ? null : courseVersion.getId(),
                buildCourseCode(course),
                courseVersion == null ? null : courseVersion.getTitle(),
                section.getSectionLetter(),
                buildDisplaySectionCode(section),
                section.getTitle(),
                section.isHonors(),
                section.isLab(),
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
                section.getStartDate(),
                section.getEndDate(),
                section.getParentSection() == null ? null : section.getParentSection().getId(),
                section.getLinkedGroupCode(),
                section.getNotes(),
                buildEnrollmentSummary(section),
                instructors.stream().map(this::toCourseSectionInstructorResponse).toList(),
                meetings.stream().map(this::toCourseSectionMeetingResponse).toList()
        );
    }

    public CourseSectionInstructorResponse toCourseSectionInstructorResponse(CourseSectionInstructor instructor) {
        Staff staff = instructor.getStaff();
        SectionInstructorRole role = instructor.getRole();

        return new CourseSectionInstructorResponse(
                instructor.getId(),
                staff == null ? null : staff.getId(),
                staff == null ? null : staff.getFirstName(),
                staff == null ? null : staff.getLastName(),
                staff == null ? null : staff.getEmail(),
                role == null ? null : role.getId(),
                role == null ? null : role.getCode(),
                role == null ? null : role.getName(),
                instructor.isPrimary(),
                instructor.getAssignmentStartDate(),
                instructor.getAssignmentEndDate()
        );
    }

    public CourseSectionMeetingResponse toCourseSectionMeetingResponse(CourseSectionMeeting meeting) {
        SectionMeetingType meetingType = meeting.getMeetingType();

        return new CourseSectionMeetingResponse(
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

    public void applyPatch(
            CourseSection section,
            PatchCourseSectionRequest request,
            String finalSectionLetter,
            PatchValue<CourseSectionStatus> status,
            PatchValue<AcademicDivision> academicDivision,
            PatchValue<DeliveryMode> deliveryMode,
            PatchValue<GradingBasis> gradingBasis
    ) {
        apply(request.getSectionLetter(), ignored -> section.setSectionLetter(finalSectionLetter));
        applyTrimmed(request.getTitle(), section::setTitle);
        apply(request.getHonors(), section::setHonors);
        apply(request.getLab(), section::setLab);
        apply(status, section::setStatus);
        apply(academicDivision, section::setAcademicDivision);
        apply(deliveryMode, section::setDeliveryMode);
        apply(gradingBasis, section::setGradingBasis);
        apply(request.getCredits(), section::setCredits);
        apply(request.getCapacity(), section::setCapacity);
        apply(request.getHardCapacity(), section::setHardCapacity);
        apply(request.getWaitlistAllowed(), section::setWaitlistAllowed);
        apply(request.getStartDate(), section::setStartDate);
        apply(request.getEndDate(), section::setEndDate);
        applyTrimmed(request.getLinkedGroupCode(), section::setLinkedGroupCode);
        applyTrimmed(request.getNotes(), section::setNotes);
    }

    private String buildDisplaySectionCode(CourseSection section) {
        StringBuilder displayCode = new StringBuilder(section.getSectionLetter() == null ? "" : section.getSectionLetter());

        if (section.isHonors()) {
            displayCode.append("H");
        }

        if (section.isLab()) {
            displayCode.append("L");
        }

        return displayCode.toString();
    }

    private CourseSectionEnrollmentSummaryResponse buildEnrollmentSummary(CourseSection section) {
        List<StudentSectionEnrollment> enrollments = section.getEnrollments() == null
                ? List.of()
                : section.getEnrollments();
        int enrolledCount = (int) enrollments.stream()
                .filter(enrollment -> enrollment.getStatus() != null)
                .filter(enrollment -> "REGISTERED".equalsIgnoreCase(enrollment.getStatus().getCode()))
                .count();
        int waitlistedCount = (int) enrollments.stream()
                .filter(enrollment -> enrollment.getStatus() != null)
                .filter(enrollment -> "WAITLISTED".equalsIgnoreCase(enrollment.getStatus().getCode()))
                .count();

        return new CourseSectionEnrollmentSummaryResponse(
                enrolledCount,
                waitlistedCount,
                section.getCapacity() == null ? 0 : section.getCapacity(),
                section.getHardCapacity(),
                section.isWaitlistAllowed()
        );
    }

    private List<CourseSectionInstructor> sortedInstructors(CourseSection section) {
        return section.getInstructors() == null
                ? List.of()
                : section.getInstructors().stream()
                .sorted(Comparator.comparing(CourseSectionInstructor::isPrimary).reversed()
                        .thenComparing(instructor -> instructor.getStaff() == null ? null : instructor.getStaff().getLastName(), Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(instructor -> instructor.getStaff() == null ? null : instructor.getStaff().getFirstName(), Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
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

    private String buildPrimaryInstructorName(List<CourseSectionInstructor> instructors) {
        return instructors.stream()
                .filter(CourseSectionInstructor::isPrimary)
                .findFirst()
                .map(this::buildInstructorName)
                .orElseGet(() -> instructors.stream().findFirst().map(this::buildInstructorName).orElse(null));
    }

    private String buildInstructorSummary(List<CourseSectionInstructor> instructors) {
        if (instructors.isEmpty()) {
            return null;
        }

        return instructors.stream()
                .map(this::buildInstructorName)
                .filter(Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private String buildInstructorName(CourseSectionInstructor instructor) {
        Staff staff = instructor.getStaff();

        if (staff == null) {
            return null;
        }

        String firstName = staff.getFirstName() == null ? "" : staff.getFirstName().trim();
        String lastName = staff.getLastName() == null ? "" : staff.getLastName().trim();
        String name = (firstName + " " + lastName).trim();

        return name.isBlank() ? staff.getEmail() : name;
    }

    private String buildMeetingSummary(List<CourseSectionMeeting> meetings) {
        if (meetings.isEmpty()) {
            return null;
        }

        return meetings.stream()
                .map(this::buildMeetingDisplay)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.joining("; "));
    }

    private String buildMeetingDisplay(CourseSectionMeeting meeting) {
        String dayLabel = formatDayOfWeek(meeting.getDayOfWeek());
        String timeLabel = formatTimeRange(meeting.getStartTime(), meeting.getEndTime());

        if (dayLabel == null && timeLabel == null) {
            return null;
        }

        if (dayLabel == null) {
            return timeLabel;
        }

        if (timeLabel == null) {
            return dayLabel;
        }

        return dayLabel + " " + timeLabel;
    }

    private String buildRoomSummary(List<CourseSectionMeeting> meetings) {
        if (meetings.isEmpty()) {
            return null;
        }

        String summary = meetings.stream()
                .map(this::buildRoomDisplay)
                .filter(Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));

        return summary.isBlank() ? null : summary;
    }

    private String buildRoomDisplay(CourseSectionMeeting meeting) {
        String building = meeting.getBuilding() == null ? "" : meeting.getBuilding().trim();
        String room = meeting.getRoom() == null ? "" : meeting.getRoom().trim();
        String roomDisplay = (building + " " + room).trim();

        return roomDisplay.isBlank() ? null : roomDisplay;
    }

    private String formatDayOfWeek(Short dayOfWeek) {
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

    private String formatTimeRange(LocalTime startTime, LocalTime endTime) {
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

    private String buildCourseCode(Course course) {
        if (course == null) {
            return null;
        }

        AcademicSubject subject = course.getSubject();

        if (subject == null || subject.getCode() == null) {
            return course.getCourseNumber();
        }

        return subject.getCode() + course.getCourseNumber();
    }

}
