package com.msm.sis.api.service.instructor;

import com.msm.sis.api.dto.course.CourseSectionMeetingResponse;
import com.msm.sis.api.dto.instructor.schedule.InstructorScheduleSearchCriteria;
import com.msm.sis.api.dto.instructor.schedule.InstructorScheduleSearchPageResponse;
import com.msm.sis.api.dto.instructor.schedule.InstructorScheduleSearchResponse;
import com.msm.sis.api.dto.instructor.schedule.InstructorScheduleSearchResultResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseSectionStatus;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.DeliveryMode;
import com.msm.sis.api.entity.InstructionalAssignmentRole;
import com.msm.sis.api.entity.SectionMeetingType;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.mapper.CourseSectionMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class InstructorScheduleSearchService {
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 25;
    private static final int MAX_PAGE_SIZE = 100;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a", Locale.US);

    private final AcademicTermRepository academicTermRepository;
    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final CourseSectionMapper courseSectionMapper;
    private final StaffRepository staffRepository;

    @Transactional(readOnly = true)
    public InstructorScheduleSearchResponse searchAdminSchedules(InstructorScheduleSearchCriteria criteria) {
        return searchSchedules(criteria, null, null, false);
    }

    @Transactional(readOnly = true)
    public InstructorScheduleSearchResponse searchVisibleSchedulesForStaff(
            Long staffId,
            InstructorScheduleSearchCriteria criteria
    ) {
        requirePositiveId(staffId, "Staff id");

        return searchSchedules(criteria, staffId, null, true);
    }

    @Transactional(readOnly = true)
    public InstructorScheduleSearchResponse searchSchedulesForInstructorUser(
            Long userId,
            InstructorScheduleSearchCriteria criteria
    ) {
        Staff staff = findStaffByUserId(userId);

        return searchSchedules(criteria, staff.getId(), null, false);
    }

    @Transactional(readOnly = true)
    public InstructorScheduleSearchResponse searchVisibleSchedulesForCurrentUser(
            Long userId,
            InstructorScheduleSearchCriteria criteria
    ) {
        Staff staff = findStaffByUserId(userId);

        return searchVisibleSchedulesForStaff(staff.getId(), criteria);
    }

    private Staff findStaffByUserId(Long userId) {
        requirePositiveId(userId, "User id");

        return staffRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Staff record was not found for the requested user."
                ));
    }

    private InstructorScheduleSearchResponse searchSchedules(
            InstructorScheduleSearchCriteria criteria,
            Long forcedStaffId,
            String forcedStatusCode,
            boolean excludeDraft
    ) {
        InstructorScheduleSearchCriteria effectiveCriteria =
                criteria == null ? new InstructorScheduleSearchCriteria() : criteria;
        int page = effectiveCriteria.getPage() == null ? DEFAULT_PAGE : effectiveCriteria.getPage();
        int size = effectiveCriteria.getSize() == null ? DEFAULT_SIZE : effectiveCriteria.getSize();

        validatePageRequest(page, size, MAX_PAGE_SIZE);

        List<Long> subTermIds = normalizeSubTermIds(effectiveCriteria.getSubTermIds());
        Page<CourseSectionInstructor> resultPage =
                courseSectionInstructorRepository.searchInstructorScheduleAssignments(
                        effectiveCriteria.getAcademicYearId(),
                        effectiveCriteria.getTermId(),
                        subTermIds.isEmpty() ? List.of(-1L) : subTermIds,
                        subTermIds.isEmpty(),
                        effectiveCriteria.getSchoolId(),
                        effectiveCriteria.getDepartmentId(),
                        forcedStaffId == null ? effectiveCriteria.getStaffId() : forcedStaffId,
                        excludeDraft,
                        normalizeSearchQuery(effectiveCriteria.getInstructorSearch()),
                        normalizeSearchQuery(effectiveCriteria.getCourseSearch()),
                        normalizeCode(forcedStatusCode == null ? effectiveCriteria.getStatusCode() : forcedStatusCode),
                        normalizeCode(effectiveCriteria.getRoleCode()),
                        normalizeCode(effectiveCriteria.getDeliveryModeCode()),
                        PageRequest.of(
                                page,
                                size,
                                buildSort(effectiveCriteria.getSortBy(), effectiveCriteria.getSortDirection())
                        )
                );
        Map<Long, AcademicTerm> termsBySubTermId = findTermsBySubTermId(resultPage.getContent());

        return new InstructorScheduleSearchResponse(
                new InstructorScheduleSearchPageResponse(
                        resultPage.getNumber(),
                        resultPage.getSize(),
                        resultPage.getTotalElements(),
                        resultPage.getTotalPages()
                ),
                resultPage.stream()
                        .map(assignment -> toResultResponse(
                                assignment,
                                termsBySubTermId.get(getSubTermId(assignment))
                        ))
                        .toList()
        );
    }

    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String normalizedSortBy = normalizeSortBy(sortBy, "instructor");

        return switch (normalizedSortBy) {
            case "academicYear" -> Sort.by(direction, "courseSection.subTerm.academicYear.startDate")
                    .and(Sort.by(direction, "courseSection.subTerm.academicYear.code"))
                    .and(Sort.by(Sort.Direction.ASC, "courseSection.subTerm.sortOrder"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "course" -> Sort.by(direction, "courseSection.courseOffering.courseVersion.course.subject.code")
                    .and(Sort.by(direction, "courseSection.courseOffering.courseVersion.course.courseNumber"))
                    .and(Sort.by(direction, "courseSection.sectionLetter"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "department" -> Sort.by(direction, "courseSection.courseOffering.courseVersion.course.subject.department.name")
                    .and(Sort.by(direction, "courseSection.courseOffering.courseVersion.course.subject.code"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "deliveryMode" -> Sort.by(direction, "courseSection.deliveryMode.name")
                    .and(Sort.by(direction, "courseSection.courseOffering.courseVersion.course.subject.code"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "role" -> Sort.by(direction, "role.sortOrder")
                    .and(Sort.by(direction, "role.name"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "school" -> Sort.by(direction, "courseSection.courseOffering.courseVersion.course.subject.department.school.name")
                    .and(Sort.by(direction, "courseSection.courseOffering.courseVersion.course.subject.department.name"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "section" -> Sort.by(direction, "courseSection.sectionLetter")
                    .and(Sort.by(direction, "courseSection.courseOffering.courseVersion.course.subject.code"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "status" -> Sort.by(direction, "courseSection.status.sortOrder")
                    .and(Sort.by(direction, "courseSection.status.name"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "subTerm" -> Sort.by(direction, "courseSection.subTerm.sortOrder")
                    .and(Sort.by(direction, "courseSection.subTerm.startDate"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "instructor" -> Sort.by(direction, "instructorStaff.lastName")
                    .and(Sort.by(direction, "instructorStaff.firstName"))
                    .and(Sort.by(direction, "instructorUser.email"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: academicYear, course, department, deliveryMode, instructor, role, school, section, status, subTerm."
            );
        };
    }

    private InstructorScheduleSearchResultResponse toResultResponse(
            CourseSectionInstructor assignment,
            AcademicTerm term
    ) {
        CourseSection section = assignment.getCourseSection();
        CourseOffering offering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = offering == null ? null : offering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicSubject subject = course == null ? null : course.getSubject();
        AcademicDepartment department = subject == null ? null : subject.getDepartment();
        AcademicSchool school = department == null ? null : department.getSchool();
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        AcademicYear academicYear = subTerm == null ? null : subTerm.getAcademicYear();
        CourseSectionStatus status = section == null ? null : section.getStatus();
        DeliveryMode deliveryMode = section == null ? null : section.getDeliveryMode();
        Staff staff = assignment.getInstructorStaff();
        SisUser user = assignment.getInstructorUser();
        InstructionalAssignmentRole role = assignment.getRole();
        List<CourseSectionMeeting> meetings = sortedMeetings(section);
        String courseCode = buildCourseCode(course);
        String displaySectionCode = buildDisplaySectionCode(courseCode, section);

        return new InstructorScheduleSearchResultResponse(
                assignment.getId(),
                staff == null ? null : staff.getId(),
                user == null ? null : user.getId(),
                buildInstructorName(staff, user),
                staff == null ? user == null ? null : user.getEmail() : staff.getEmail(),
                section == null ? null : section.getId(),
                offering == null ? null : offering.getId(),
                section == null ? null : section.getSectionLetter(),
                displaySectionCode,
                section == null ? null : section.getTitle(),
                section != null && section.isHonors(),
                status == null ? null : status.getCode(),
                status == null ? null : status.getName(),
                course == null ? null : course.getId(),
                courseCode,
                courseVersion == null ? null : courseVersion.getTitle(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                subTerm == null ? null : subTerm.getId(),
                subTerm == null ? null : subTerm.getCode(),
                subTerm == null ? null : subTerm.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                role == null ? null : role.getCode(),
                role == null ? null : role.getName(),
                assignment.isPrimary(),
                assignment.isCanViewGrades(),
                assignment.isCanManageGrades(),
                deliveryMode == null ? null : deliveryMode.getCode(),
                deliveryMode == null ? null : deliveryMode.getName(),
                section == null ? null : section.getCredits(),
                buildMeetingSummary(meetings),
                buildRoomSummary(meetings),
                meetings.stream()
                        .map(courseSectionMapper::toCourseSectionMeetingResponse)
                        .toList()
        );
    }

    private Map<Long, AcademicTerm> findTermsBySubTermId(List<CourseSectionInstructor> assignments) {
        List<Long> subTermIds = assignments.stream()
                .map(this::getSubTermId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (subTermIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, AcademicTerm> termsBySubTermId = new LinkedHashMap<>();

        academicTermRepository.findDistinctByAcademicSubTerms_IdIn(subTermIds)
                .forEach(term -> term.getAcademicSubTerms().forEach(
                        subTerm -> termsBySubTermId.putIfAbsent(subTerm.getId(), term)
                ));

        return termsBySubTermId;
    }

    private Long getSubTermId(CourseSectionInstructor assignment) {
        CourseSection section = assignment.getCourseSection();
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();

        return subTerm == null ? null : subTerm.getId();
    }

    private List<Long> normalizeSubTermIds(List<Long> subTermIds) {
        return subTermIds == null
                ? List.of()
                : subTermIds.stream()
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .distinct()
                .toList();
    }

    private String normalizeSearchQuery(String value) {
        String trimmedValue = trimToNull(value);

        return trimmedValue == null ? null : "%" + trimmedValue.toLowerCase(Locale.US) + "%";
    }

    private String normalizeCode(String value) {
        String normalizedValue = trimToNull(value);

        if (normalizedValue == null || "ALL".equalsIgnoreCase(normalizedValue)) {
            return null;
        }

        return normalizedValue.toUpperCase(Locale.US);
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

    private String buildInstructorName(Staff staff, SisUser user) {
        if (staff == null) {
            return user == null ? null : user.getEmail();
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

        String summary = meetings.stream()
                .map(this::buildMeetingDisplay)
                .filter(Objects::nonNull)
                .distinct()
                .reduce((left, right) -> left + "; " + right)
                .orElse(null);

        return trimToNull(summary);
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
                .reduce((left, right) -> left + ", " + right)
                .orElse(null);

        return trimToNull(summary);
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

    private String buildDisplaySectionCode(String courseCode, CourseSection section) {
        if (section == null) {
            return courseCode;
        }

        String sectionLetter = trimToNull(section.getSectionLetter());
        String displaySection = sectionLetter == null ? "" : sectionLetter;

        if (trimToNull(courseCode) == null) {
            return trimToNull(displaySection);
        }

        return trimToNull(displaySection) == null ? courseCode : courseCode + " " + displaySection;
    }
}
