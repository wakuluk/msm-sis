package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CreateCourseSectionInstructorRequest;
import com.msm.sis.api.dto.course.CreateCourseSectionMeetingRequest;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.InstructionalAssignmentRoleRepository;
import com.msm.sis.api.repository.SectionMeetingTypeRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class CourseSectionAssignmentService {
    private static final String DEFAULT_INSTRUCTOR_ROLE_CODE = "PRIMARY_INSTRUCTOR";
    private static final String DEFAULT_MEETING_TYPE_CODE = "CLASS";

    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final CourseSectionMeetingRepository courseSectionMeetingRepository;
    private final InstructionalAssignmentRoleRepository instructionalAssignmentRoleRepository;
    private final SectionMeetingTypeRepository sectionMeetingTypeRepository;
    private final SisUserRepository sisUserRepository;
    private final StaffRepository staffRepository;
    private final CourseSectionValidationService courseSectionValidationService;

    public List<CourseSectionInstructor> createInstructors(
            CourseSection courseSection,
            List<CreateCourseSectionInstructorRequest> requests
    ) {
        List<CourseSectionInstructor> instructors = buildInstructors(courseSection, requests);

        if (!instructors.isEmpty()) {
            courseSectionInstructorRepository.saveAll(instructors);
        }

        return instructors;
    }

    public List<CourseSectionMeeting> createMeetings(
            CourseSection courseSection,
            List<CreateCourseSectionMeetingRequest> requests
    ) {
        List<CourseSectionMeeting> meetings = buildMeetings(courseSection, requests);

        if (!meetings.isEmpty()) {
            courseSectionMeetingRepository.saveAll(meetings);
        }

        return meetings;
    }

    public List<CourseSectionInstructor> replaceInstructors(
            CourseSection courseSection,
            List<CreateCourseSectionInstructorRequest> requests
    ) {
        courseSectionInstructorRepository.deleteAllByCourseSectionId(courseSection.getId());
        courseSectionInstructorRepository.flush();
        return createInstructors(courseSection, requests);
    }

    public List<CourseSectionMeeting> replaceMeetings(
            CourseSection courseSection,
            List<CreateCourseSectionMeetingRequest> requests
    ) {
        courseSectionMeetingRepository.deleteAllByCourseSectionId(courseSection.getId());
        return createMeetings(courseSection, requests);
    }

    private List<CourseSectionInstructor> buildInstructors(
            CourseSection courseSection,
            List<CreateCourseSectionInstructorRequest> requests
    ) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        Set<Long> instructorStaffIds = new HashSet<>();
        List<CourseSectionInstructor> instructors = new ArrayList<>();

        for (CreateCourseSectionInstructorRequest request : requests) {
            courseSectionValidationService.validateInstructorRequest(request);

            String roleCode = normalizeInstructorRoleCode(request.roleCode());
            if (!instructorStaffIds.add(request.staffId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "An instructor can only be assigned once to a course section."
                );
            }

            Staff staff = staffRepository.findById(request.staffId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Instructor staff id does not exist."
                    ));
            if (staff.getUserId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Instructor staff record is not linked to a user."
                );
            }

            CourseSectionInstructor instructor = new CourseSectionInstructor();
            instructor.setCourseSection(courseSection);
            instructor.setInstructorUser(sisUserRepository.findById(staff.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Instructor user id does not exist."
                    )));
            instructor.setInstructorStaff(staff);
            instructor.setRole(resolveRequiredReference(
                    roleCode,
                    instructionalAssignmentRoleRepository::findByCode,
                    "Instructional assignment role"
            ));
            instructor.setCanViewGrades(
                    request.canViewGrades() == null
                            ? instructor.getRole().isDefaultCanViewGrades()
                            : request.canViewGrades()
            );
            instructor.setCanManageGrades(
                    request.canManageGrades() == null
                            ? instructor.getRole().isDefaultCanManageGrades()
                            : request.canManageGrades()
            );
            instructors.add(instructor);
        }

        return instructors;
    }

    private List<CourseSectionMeeting> buildMeetings(
            CourseSection courseSection,
            List<CreateCourseSectionMeetingRequest> requests
    ) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        Set<Integer> sequenceNumbers = new HashSet<>();
        List<CourseSectionMeeting> meetings = new ArrayList<>();

        for (int index = 0; index < requests.size(); index += 1) {
            CreateCourseSectionMeetingRequest request = requests.get(index);
            courseSectionValidationService.validateMeetingRequest(request);

            int sequenceNumber = request.sequenceNumber() == null ? index + 1 : request.sequenceNumber();
            if (sequenceNumber < 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Meeting sequence number must be greater than zero."
                );
            }
            if (!sequenceNumbers.add(sequenceNumber)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Meeting sequence numbers must be unique for a course section."
                );
            }

            CourseSectionMeeting meeting = new CourseSectionMeeting();
            meeting.setCourseSection(courseSection);
            meeting.setMeetingType(resolveRequiredReference(
                    Optional.ofNullable(trimToNull(request.meetingTypeCode())).orElse(DEFAULT_MEETING_TYPE_CODE),
                    sectionMeetingTypeRepository::findByCode,
                    "Section meeting type"
            ));
            meeting.setDayOfWeek(request.dayOfWeek());
            meeting.setStartTime(request.startTime());
            meeting.setEndTime(request.endTime());
            meeting.setBuilding(trimToNull(request.building()));
            meeting.setRoom(trimToNull(request.room()));
            meeting.setStartDate(request.startDate());
            meeting.setEndDate(request.endDate());
            meeting.setSequenceNumber(sequenceNumber);
            meetings.add(meeting);
        }

        return meetings;
    }

    private String normalizeInstructorRoleCode(String requestedRoleCode) {
        String roleCode = Optional.ofNullable(trimToNull(requestedRoleCode)).orElse(DEFAULT_INSTRUCTOR_ROLE_CODE);

        return "PRIMARY".equalsIgnoreCase(roleCode) ? DEFAULT_INSTRUCTOR_ROLE_CODE : roleCode;
    }

    private <T> T resolveRequiredReference(
            String code,
            Function<String, Optional<T>> lookup,
            String label
    ) {
        String normalizedCode = normalizeCode(code, label);

        return lookup.apply(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        label + " code is invalid."
                ));
    }

    private String normalizeCode(String code, String label) {
        String trimmedCode = trimToNull(code);

        if (trimmedCode == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + " code is required."
            );
        }

        return trimmedCode.toUpperCase(Locale.US);
    }
}
