package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.BulkAssignRegistrationGroupStudentsRequest;
import com.msm.sis.api.dto.registration.BulkAssignRegistrationGroupStudentsResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class RegistrationGroupUnassignedStudentAssignmentService {
    private static final String ASSIGNMENT_SOURCE_MANUAL = "MANUAL";

    private final RegistrationGroupRepository registrationGroupRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final SisUserRepository sisUserRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public BulkAssignRegistrationGroupStudentsResponse assignUnassignedStudents(
            BulkAssignRegistrationGroupStudentsRequest request,
            Long actorUserId
    ) {
        BulkAssignRegistrationGroupStudentsRequest requiredRequest = requireRequestBody(request);
        RegistrationGroup registrationGroup = resolveRegistrationGroup(requiredRequest.registrationGroupId());
        List<Long> studentIds = normalizeStudentIds(requiredRequest.studentIds());
        Map<Long, Student> studentsById = loadActiveStudents(studentIds);
        validateStudentsAreStillUnassigned(registrationGroup, studentIds);
        SisUser actorUser = resolveActorUser(actorUserId);

        List<RegistrationGroupStudent> assignments = studentIds.stream()
                .map(studentId -> buildAssignment(registrationGroup, studentsById.get(studentId), actorUser))
                .toList();
        registrationGroupStudentRepository.saveAll(assignments);

        registrationGroup.setUpdatedByUser(actorUser);
        registrationGroupRepository.save(registrationGroup);

        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        return new BulkAssignRegistrationGroupStudentsResponse(
                registrationGroup.getId(),
                registrationGroup.getName(),
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                term.getId(),
                term.getCode(),
                term.getName(),
                studentIds.size(),
                assignments.size(),
                countRemainingUnassignedStudents(academicYear.getId(), term.getId()),
                studentIds
        );
    }

    private RegistrationGroup resolveRegistrationGroup(Long registrationGroupId) {
        return registrationGroupRepository.findRegistrationGroupDetail(
                        requirePositiveId(registrationGroupId, "Registration group id")
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration group was not found."
                ));
    }

    private List<Long> normalizeStudentIds(List<Long> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one student is required.");
        }

        Set<Long> normalizedStudentIds = new LinkedHashSet<>();
        for (Long studentId : studentIds) {
            Long normalizedStudentId = requirePositiveId(studentId, "Student id");
            if (!normalizedStudentIds.add(normalizedStudentId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A student can only be assigned once."
                );
            }
        }
        return List.copyOf(normalizedStudentIds);
    }

    private Map<Long, Student> loadActiveStudents(List<Long> studentIds) {
        Map<Long, Student> studentsById = studentRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));
        List<Long> missingStudentIds = new ArrayList<>();
        for (Long studentId : studentIds) {
            Student student = studentsById.get(studentId);
            if (student == null || student.isDisabled()) {
                missingStudentIds.add(studentId);
            }
        }
        if (!missingStudentIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student " + missingStudentIds.getFirst() + " was not found."
            );
        }
        return studentsById;
    }

    private void validateStudentsAreStillUnassigned(
            RegistrationGroup registrationGroup,
            List<Long> studentIds
    ) {
        List<RegistrationGroupStudent> existingAssignments =
                registrationGroupStudentRepository.findAssignmentsForStudentsInPeriod(
                        studentIds,
                        registrationGroup.getAcademicYear().getId(),
                        registrationGroup.getTerm().getId()
                );
        if (existingAssignments.isEmpty()) {
            return;
        }

        RegistrationGroupStudent existingAssignment = existingAssignments.getFirst();
        Student student = existingAssignment.getStudent();
        RegistrationGroup existingGroup = existingAssignment.getRegistrationGroup();
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                buildDisplayName(student)
                        + " is already assigned to "
                        + existingGroup.getName()
                        + " for this academic year and term."
        );
    }

    private RegistrationGroupStudent buildAssignment(
            RegistrationGroup registrationGroup,
            Student student,
            SisUser actorUser
    ) {
        RegistrationGroupStudent assignment = new RegistrationGroupStudent();
        assignment.setRegistrationGroup(registrationGroup);
        assignment.setStudent(student);
        assignment.setAssignmentSource(ASSIGNMENT_SOURCE_MANUAL);
        assignment.setCreatedByUser(actorUser);
        assignment.setUpdatedByUser(actorUser);
        return assignment;
    }

    private long countRemainingUnassignedStudents(Long academicYearId, Long termId) {
        List<Student> activeStudents = studentRepository.findActiveStudentsForRegistrationGroupPreview();
        if (activeStudents.isEmpty()) {
            return 0;
        }

        List<Long> activeStudentIds = activeStudents.stream()
                .map(Student::getId)
                .toList();
        Set<Long> assignedStudentIds = registrationGroupStudentRepository
                .findAssignmentsForStudentsInPeriod(activeStudentIds, academicYearId, termId)
                .stream()
                .map(RegistrationGroupStudent::getStudent)
                .map(Student::getId)
                .collect(Collectors.toSet());

        return activeStudentIds.stream()
                .filter(studentId -> !assignedStudentIds.contains(studentId))
                .count();
    }

    private SisUser resolveActorUser(Long actorUserId) {
        if (actorUserId == null) {
            return null;
        }

        return sisUserRepository.findById(actorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User was not found."));
    }

    private String buildDisplayName(Student student) {
        String firstName = student == null ? null : student.getFirstName();
        String lastName = student == null ? null : student.getLastName();
        String displayName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        if (!displayName.isBlank()) {
            return displayName;
        }

        String email = student == null ? null : student.getEmail();
        return email == null ? "Student" : email;
    }
}
