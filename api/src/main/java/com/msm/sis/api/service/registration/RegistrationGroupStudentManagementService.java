package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.AddRegistrationGroupStudentRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupDetailResponse;
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

import java.util.List;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class RegistrationGroupStudentManagementService {
    private static final String ASSIGNMENT_SOURCE_MANUAL = "MANUAL";

    private final RegistrationGroupDetailService detailService;
    private final RegistrationGroupRepository registrationGroupRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final SisUserRepository sisUserRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public RegistrationGroupDetailResponse addStudent(
            Long registrationGroupId,
            AddRegistrationGroupStudentRequest request,
            Long actorUserId
    ) {
        AddRegistrationGroupStudentRequest requiredRequest = requireRequestBody(request);
        RegistrationGroup registrationGroup = resolveRegistrationGroup(registrationGroupId);
        Student student = resolveStudent(requiredRequest.studentId());
        List<RegistrationGroupStudent> existingAssignments = findExistingAssignments(registrationGroup, student);
        validateStudentIsNotAlreadyAssigned(
                registrationGroup,
                existingAssignments,
                Boolean.TRUE.equals(requiredRequest.moveExistingAssignment())
        );
        SisUser actorUser = resolveActorUser(actorUserId);

        removeMovedAssignments(registrationGroup, existingAssignments, actorUser);

        RegistrationGroupStudent registrationGroupStudent = new RegistrationGroupStudent();
        registrationGroupStudent.setRegistrationGroup(registrationGroup);
        registrationGroupStudent.setStudent(student);
        registrationGroupStudent.setAssignmentSource(ASSIGNMENT_SOURCE_MANUAL);
        registrationGroupStudent.setCreatedByUser(actorUser);
        registrationGroupStudent.setUpdatedByUser(actorUser);
        registrationGroupStudentRepository.save(registrationGroupStudent);

        registrationGroup.setUpdatedByUser(actorUser);
        registrationGroupRepository.save(registrationGroup);

        return detailService.getRegistrationGroupDetail(registrationGroup.getId());
    }

    @Transactional
    public RegistrationGroupDetailResponse removeStudent(
            Long registrationGroupId,
            Long studentId,
            Long actorUserId
    ) {
        RegistrationGroup registrationGroup = resolveRegistrationGroup(registrationGroupId);
        Long normalizedStudentId = requirePositiveId(studentId, "Student id");
        RegistrationGroupStudent registrationGroupStudent =
                registrationGroupStudentRepository.findByRegistrationGroupIdAndStudentId(
                                registrationGroup.getId(),
                                normalizedStudentId
                        )
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Student assignment was not found."
                        ));
        SisUser actorUser = resolveActorUser(actorUserId);

        registrationGroupStudentRepository.delete(registrationGroupStudent);
        registrationGroup.setUpdatedByUser(actorUser);
        registrationGroupRepository.save(registrationGroup);

        return detailService.getRegistrationGroupDetail(registrationGroup.getId());
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

    private Student resolveStudent(Long studentId) {
        Student student = studentRepository.findById(requirePositiveId(studentId, "Student id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student was not found."));
        if (student.isDisabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student is disabled.");
        }
        return student;
    }

    private void validateStudentIsNotAlreadyAssigned(
            RegistrationGroup registrationGroup,
            List<RegistrationGroupStudent> existingAssignments,
            boolean moveExistingAssignment
    ) {
        existingAssignments.stream()
                .filter(assignment -> assignment.getRegistrationGroup().getId().equals(registrationGroup.getId()))
                .findFirst()
                .ifPresent(assignment -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Student is already assigned to this registration group."
                    );
                });

        existingAssignments.stream()
                .filter(assignment -> !assignment.getRegistrationGroup().getId().equals(registrationGroup.getId()))
                .findFirst()
                .ifPresent(assignment -> {
                    if (moveExistingAssignment) {
                        return;
                    }

                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Student is already assigned to "
                                    + assignment.getRegistrationGroup().getName()
                                    + " for this academic year and term."
                    );
                });
    }

    private List<RegistrationGroupStudent> findExistingAssignments(
            RegistrationGroup registrationGroup,
            Student student
    ) {
        return registrationGroupStudentRepository.findAssignmentsForStudentsInPeriod(
                List.of(student.getId()),
                registrationGroup.getAcademicYear().getId(),
                registrationGroup.getTerm().getId()
        );
    }

    private void removeMovedAssignments(
            RegistrationGroup registrationGroup,
            List<RegistrationGroupStudent> existingAssignments,
            SisUser actorUser
    ) {
        List<RegistrationGroupStudent> movedAssignments = existingAssignments.stream()
                .filter(assignment -> !assignment.getRegistrationGroup().getId().equals(registrationGroup.getId()))
                .toList();

        if (movedAssignments.isEmpty()) {
            return;
        }

        movedAssignments.forEach(assignment -> assignment.getRegistrationGroup().setUpdatedByUser(actorUser));
        registrationGroupStudentRepository.deleteAll(movedAssignments);
    }

    private SisUser resolveActorUser(Long actorUserId) {
        if (actorUserId == null) {
            return null;
        }

        return sisUserRepository.findById(actorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User was not found."));
    }
}
