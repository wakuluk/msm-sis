package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.schedule.StudentScheduleCourseResponse;
import com.msm.sis.api.dto.student.schedule.StudentScheduleHistoricalCourseResponse;
import com.msm.sis.api.dto.student.schedule.StudentScheduleMeetingResponse;
import com.msm.sis.api.dto.student.schedule.StudentScheduleResponse;
import com.msm.sis.api.dto.student.schedule.StudentScheduleTermOptionResponse;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository.StudentScheduleEnrollmentProjection;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class StudentScheduleService {
    private final CourseSectionMeetingRepository courseSectionMeetingRepository;
    private final StudentRepository studentRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;

    public StudentScheduleService(
            CourseSectionMeetingRepository courseSectionMeetingRepository,
            StudentRepository studentRepository,
            StudentSectionEnrollmentRepository enrollmentRepository
    ) {
        this.courseSectionMeetingRepository = courseSectionMeetingRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional(readOnly = true)
    public StudentScheduleResponse getScheduleForAuthenticatedStudent(Long userId, Long termId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));

        return buildScheduleForStudent(student, termId);
    }

    @Transactional(readOnly = true)
    public StudentScheduleResponse getScheduleForStudent(Long studentId, Long termId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Student record was not found."
                ));

        return buildScheduleForStudent(student, termId);
    }

    private StudentScheduleResponse buildScheduleForStudent(Student student, Long termId) {
        List<StudentScheduleEnrollmentProjection> allRows =
                enrollmentRepository.findStudentScheduleEnrollments(student.getId(), null);
        attachSectionMeetings(allRows);
        List<AcademicTerm> terms = distinctTerms(allRows);
        AcademicTerm selectedTerm = selectTerm(terms, termId);
        List<StudentScheduleEnrollmentProjection> selectedRows = allRows.stream()
                .filter(row -> row.getTerm() != null)
                .filter(row -> Objects.equals(row.getTerm().getId(), selectedTerm == null ? null : selectedTerm.getId()))
                .toList();
        boolean selectedTermCurrentOrFuture = isCurrentOrFuture(selectedTerm);
        List<StudentSectionEnrollment> selectedEnrollments = distinctEnrollments(selectedRows);
        List<StudentSectionEnrollment> scheduledEnrollments = selectedEnrollments.stream()
                .filter(enrollment -> isScheduledEnrollment(enrollment, selectedTermCurrentOrFuture))
                .toList();
        List<StudentSectionEnrollment> notOnScheduleEnrollments = selectedEnrollments.stream()
                .filter(this::isNotOnScheduleEnrollment)
                .toList();

        return new StudentScheduleResponse(
                student.getId(),
                displayName(student),
                selectedTerm == null ? null : selectedTerm.getId(),
                terms.stream()
                        .map(term -> toTermOption(term, selectedTerm))
                        .toList(),
                scheduledEnrollments.stream()
                        .map(enrollment -> toScheduledCourse(selectedTerm, enrollment))
                        .toList(),
                notOnScheduleEnrollments.stream()
                        .map(enrollment -> toHistoricalCourse(selectedTerm, enrollment))
                        .toList(),
                scheduledEnrollments.stream()
                        .flatMap(enrollment -> toScheduleMeetings(selectedTerm, enrollment).stream())
                        .toList()
        );
    }

    private List<AcademicTerm> distinctTerms(List<StudentScheduleEnrollmentProjection> rows) {
        Map<Long, AcademicTerm> termsById = new LinkedHashMap<>();
        for (StudentScheduleEnrollmentProjection row : rows) {
            AcademicTerm term = row.getTerm();
            if (term != null && term.getId() != null) {
                termsById.putIfAbsent(term.getId(), term);
            }
        }

        return termsById.values().stream()
                .sorted(termOptionComparator())
                .toList();
    }

    private List<StudentSectionEnrollment> distinctEnrollments(List<StudentScheduleEnrollmentProjection> rows) {
        Map<Long, StudentSectionEnrollment> enrollmentsById = new LinkedHashMap<>();
        for (StudentScheduleEnrollmentProjection row : rows) {
            StudentSectionEnrollment enrollment = row.getEnrollment();
            if (enrollment != null && enrollment.getId() != null) {
                enrollmentsById.putIfAbsent(enrollment.getId(), enrollment);
            }
        }

        return List.copyOf(enrollmentsById.values());
    }

    private void attachSectionMeetings(List<StudentScheduleEnrollmentProjection> rows) {
        Map<Long, CourseSection> sectionsById = new LinkedHashMap<>();
        for (StudentScheduleEnrollmentProjection row : rows) {
            StudentSectionEnrollment enrollment = row.getEnrollment();
            CourseSection section = enrollment == null ? null : enrollment.getCourseSection();
            if (section != null && section.getId() != null) {
                sectionsById.putIfAbsent(section.getId(), section);
            }
        }

        if (sectionsById.isEmpty()) {
            return;
        }

        Map<Long, List<CourseSectionMeeting>> meetingsBySectionId =
                courseSectionMeetingRepository.findAllByCourseSectionIdIn(sectionsById.keySet()).stream()
                        .collect(Collectors.groupingBy(meeting -> meeting.getCourseSection().getId()));

        sectionsById.forEach((sectionId, section) ->
                section.setMeetings(meetingsBySectionId.getOrDefault(sectionId, List.of())));
    }

    private AcademicTerm selectTerm(List<AcademicTerm> terms, Long requestedTermId) {
        if (terms.isEmpty()) {
            return null;
        }

        if (requestedTermId != null) {
            return terms.stream()
                    .filter(term -> Objects.equals(term.getId(), requestedTermId))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Selected term is not available for this student's schedule."
                    ));
        }

        return terms.stream()
                .min(defaultTermComparator())
                .orElse(terms.getFirst());
    }

    private Comparator<AcademicTerm> defaultTermComparator() {
        LocalDate today = LocalDate.now();

        return Comparator
                .comparingInt((AcademicTerm term) -> termDefaultRank(term, today))
                .thenComparing((AcademicTerm term) -> defaultTermSortDate(term, today), Comparator.nullsLast(LocalDate::compareTo))
                .thenComparing(AcademicTerm::getId, Comparator.nullsLast(Long::compareTo));
    }

    private Comparator<AcademicTerm> termOptionComparator() {
        return Comparator
                .comparing(AcademicTerm::getStartDate, Comparator.nullsLast(LocalDate::compareTo))
                .reversed()
                .thenComparing(AcademicTerm::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private int termDefaultRank(AcademicTerm term, LocalDate today) {
        if (term == null) {
            return 3;
        }

        LocalDate startDate = term.getStartDate();
        LocalDate endDate = term.getEndDate();
        if ((startDate == null || !startDate.isAfter(today)) && (endDate == null || !endDate.isBefore(today))) {
            return 0;
        }

        if (startDate != null && startDate.isAfter(today)) {
            return 1;
        }

        return 2;
    }

    private LocalDate defaultTermSortDate(AcademicTerm term, LocalDate today) {
        if (term == null) {
            return null;
        }

        int rank = termDefaultRank(term, today);
        LocalDate startDate = term.getStartDate();
        if (rank == 2 && startDate != null) {
            return LocalDate.MAX.minusDays(startDate.toEpochDay());
        }

        return startDate;
    }

    private StudentScheduleTermOptionResponse toTermOption(AcademicTerm term, AcademicTerm selectedTerm) {
        AcademicYear academicYear = term == null ? null : term.getAcademicYear();

        return new StudentScheduleTermOptionResponse(
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getStartDate(),
                term == null ? null : term.getEndDate(),
                isCurrentOrFuture(term),
                selectedTerm != null && term != null && Objects.equals(term.getId(), selectedTerm.getId())
        );
    }

    private boolean isCurrentOrFuture(AcademicTerm term) {
        if (term == null || term.getEndDate() == null) {
            return true;
        }

        return !term.getEndDate().isBefore(LocalDate.now());
    }

    private boolean isScheduledEnrollment(StudentSectionEnrollment enrollment, boolean selectedTermCurrentOrFuture) {
        String statusCode = statusCode(enrollment);
        if (selectedTermCurrentOrFuture) {
            return "REGISTERED".equals(statusCode) || "IN_PROGRESS".equals(statusCode);
        }

        return "COMPLETED".equals(statusCode);
    }

    private boolean isNotOnScheduleEnrollment(StudentSectionEnrollment enrollment) {
        String statusCode = statusCode(enrollment);

        return "DROPPED".equals(statusCode) || "WITHDRAWN".equals(statusCode);
    }

    private StudentScheduleCourseResponse toScheduledCourse(AcademicTerm term, StudentSectionEnrollment enrollment) {
        CourseSection section = enrollment == null ? null : enrollment.getCourseSection();
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        StudentSectionEnrollmentStatus status = enrollment == null ? null : enrollment.getStatus();
        GradingBasis gradingBasis = enrollment == null ? null : enrollment.getGradingBasis();
        List<CourseSectionMeeting> meetings = sortedMeetings(section);

        return new StudentScheduleCourseResponse(
                enrollment == null ? null : enrollment.getId(),
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
                status == null ? null : status.getId(),
                status == null ? null : status.getCode(),
                status == null ? null : status.getName(),
                gradingBasis == null ? null : gradingBasis.getId(),
                gradingBasis == null ? null : gradingBasis.getCode(),
                gradingBasis == null ? null : gradingBasis.getName(),
                enrollment == null ? null : enrollment.getCreditsAttempted(),
                enrollment == null ? null : enrollment.getCreditsEarned(),
                null,
                meetingSummary(meetings),
                roomSummary(meetings),
                section == null ? null : section.getStartDate(),
                section == null ? null : section.getEndDate()
        );
    }

    private StudentScheduleHistoricalCourseResponse toHistoricalCourse(
            AcademicTerm term,
            StudentSectionEnrollment enrollment
    ) {
        CourseSection section = enrollment == null ? null : enrollment.getCourseSection();
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        StudentSectionEnrollmentStatus status = enrollment == null ? null : enrollment.getStatus();

        return new StudentScheduleHistoricalCourseResponse(
                enrollment == null ? null : enrollment.getId(),
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
                courseCode(course),
                courseVersion == null ? null : courseVersion.getTitle(),
                section == null ? null : section.getSectionLetter(),
                displaySectionCode(section),
                section == null ? null : section.getTitle(),
                status == null ? null : status.getId(),
                status == null ? null : status.getCode(),
                status == null ? null : status.getName(),
                enrollment == null ? null : enrollment.getCreditsAttempted(),
                enrollment == null ? null : enrollment.getCreditsEarned(),
                effectiveHistoricalDate(enrollment),
                enrollment == null ? null : enrollment.getStatusChangedAt()
        );
    }

    private List<StudentScheduleMeetingResponse> toScheduleMeetings(
            AcademicTerm term,
            StudentSectionEnrollment enrollment
    ) {
        CourseSection section = enrollment == null ? null : enrollment.getCourseSection();

        return sortedMeetings(section).stream()
                .map(meeting -> toScheduleMeeting(term, enrollment, section, meeting))
                .toList();
    }

    private StudentScheduleMeetingResponse toScheduleMeeting(
            AcademicTerm term,
            StudentSectionEnrollment enrollment,
            CourseSection section,
            CourseSectionMeeting meeting
    ) {
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        String id = "enrollment-"
                + (enrollment == null ? "unknown" : enrollment.getId())
                + "-"
                + (meeting == null ? "meeting" : meeting.getId());

        return new StudentScheduleMeetingResponse(
                id,
                enrollment == null ? null : enrollment.getId(),
                enrollment == null ? null : statusCode(enrollment),
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
                roomDisplay(meeting)
        );
    }

    private LocalDate effectiveHistoricalDate(StudentSectionEnrollment enrollment) {
        if (enrollment == null) {
            return null;
        }

        String statusCode = statusCode(enrollment);
        if ("DROPPED".equals(statusCode) && enrollment.getDropDate() != null) {
            return enrollment.getDropDate();
        }

        if ("WITHDRAWN".equals(statusCode) && enrollment.getWithdrawDate() != null) {
            return enrollment.getWithdrawDate();
        }

        return enrollment.getStatusChangedAt() == null ? null : enrollment.getStatusChangedAt().toLocalDate();
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
            return "Ends " + endTime;
        }

        if (endTime == null) {
            return "Starts " + startTime;
        }

        return startTime + "-" + endTime;
    }

    private String statusCode(StudentSectionEnrollment enrollment) {
        StudentSectionEnrollmentStatus status = enrollment == null ? null : enrollment.getStatus();
        String statusCode = status == null ? null : status.getCode();

        return statusCode == null ? null : statusCode.trim().toUpperCase(Locale.ROOT);
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
}
