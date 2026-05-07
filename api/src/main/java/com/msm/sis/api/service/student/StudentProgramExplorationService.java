package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.program.ExploreStudentProgramRequest;
import com.msm.sis.api.dto.student.program.StudentProgramsResponse;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.entity.StudentProgramRequest;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentAcademicPlanCourseRepository;
import com.msm.sis.api.repository.StudentProgramRequestRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentProgramExplorationService {
    private static final String STUDENT_PROGRAM_STATUS_EXPLORING = "EXPLORING";
    private static final String STUDENT_PROGRAM_REQUEST_STATUS_REQUESTED = "REQUESTED";
    private static final String STUDENT_PROGRAM_REQUEST_STATUS_REJECTED = "REJECTED";

    private final SisUserRepository sisUserRepository;
    private final StudentAcademicPlanCourseRepository studentAcademicPlanCourseRepository;
    private final StudentProgramRequestRepository studentProgramRequestRepository;
    private final StudentProgramRepository studentProgramRepository;
    private final StudentRepository studentRepository;
    private final StudentProgramTrackerService studentProgramTrackerService;
    private final StudentProgramValidationService studentProgramValidationService;

    @Transactional
    public StudentProgramsResponse exploreProgramForAuthenticatedStudent(
            Long userId,
            ExploreStudentProgramRequest request
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        return exploreProgram(student.getId(), request, userId);
    }

    @Transactional
    public StudentProgramsResponse exploreProgram(
            Long studentId,
            ExploreStudentProgramRequest request,
            Long updatedByUserId
    ) {
        ProgramVersion currentPublishedVersion =
                studentProgramValidationService.validateExploreStudentProgramRequest(studentId, request);
        Long programId = currentPublishedVersion.getProgram() == null
                ? null
                : currentPublishedVersion.getProgram().getId();
        StudentProgram currentStudentProgram =
                studentProgramValidationService.findCurrentStudentProgram(studentId, programId);

        if (currentStudentProgram != null) {
            return studentProgramTrackerService.getProgramsForStudent(studentId);
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        SisUser updatedByUser = resolveUpdatedByUser(updatedByUserId);
        StudentProgram studentProgram =
                studentProgramValidationService.findRemovedStudentProgramForReactivation(studentId, programId);

        if (studentProgram == null) {
            studentProgram = new StudentProgram();
            studentProgram.setStudent(student);
        }

        studentProgram.setProgramVersion(currentPublishedVersion);
        studentProgram.setStatus(STUDENT_PROGRAM_STATUS_EXPLORING);
        studentProgram.setDeclaredDate(null);
        studentProgram.setCompletedDate(null);
        studentProgram.setNotes(null);
        studentProgram.setUpdatedByUser(updatedByUser);
        studentProgramRepository.saveAndFlush(studentProgram);

        return studentProgramTrackerService.getProgramsForStudent(studentId);
    }

    @Transactional
    public StudentProgramsResponse removeExploredProgramForAuthenticatedStudent(
            Long userId,
            Long studentProgramId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        return removeExploredProgram(student.getId(), studentProgramId, userId);
    }

    @Transactional
    public StudentProgramsResponse removeExploredProgram(
            Long studentId,
            Long studentProgramId,
            Long updatedByUserId
    ) {
        StudentProgram studentProgram = resolveStudentProgramForRemoval(studentId, studentProgramId);
        SisUser updatedByUser = resolveUpdatedByUser(updatedByUserId);

        studentAcademicPlanCourseRepository.deleteByStudentIdAndStudentProgramId(
                studentId,
                studentProgram.getId()
        );
        detachProgramRequestsFromStudentProgram(studentProgram, updatedByUser);
        studentProgram.setUpdatedByUser(updatedByUser);
        studentProgramRepository.delete(studentProgram);
        studentProgramRepository.flush();

        return studentProgramTrackerService.getProgramsForStudent(studentId);
    }

    @Transactional
    public StudentProgramsResponse requestExploredProgramForAuthenticatedStudent(
            Long userId,
            Long studentProgramId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        return requestExploredProgram(student.getId(), studentProgramId, userId);
    }

    @Transactional
    public StudentProgramsResponse requestExploredProgram(
            Long studentId,
            Long studentProgramId,
            Long updatedByUserId
    ) {
        StudentProgram studentProgram = resolveExploredStudentProgram(
                studentId,
                studentProgramId,
                "Only explored programs can be requested by the student."
        );
        SisUser updatedByUser = resolveUpdatedByUser(updatedByUserId);
        ProgramVersion programVersion = studentProgram.getProgramVersion();
        if (programVersion == null || programVersion.getProgram() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student program is missing program details.");
        }

        List<StudentProgramRequest> openRequests =
                studentProgramRequestRepository.findOpenRequestsForStudentAndProgram(
                        studentId,
                        programVersion.getProgram().getId()
                );
        if (!openRequests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program already has an open request.");
        }

        StudentProgramRequest studentProgramRequest = new StudentProgramRequest();
        studentProgramRequest.setStudent(studentProgram.getStudent());
        studentProgramRequest.setProgram(programVersion.getProgram());
        studentProgramRequest.setStudentProgram(studentProgram);
        studentProgramRequest.setRequestedProgramVersion(programVersion);
        studentProgramRequest.setStatus(STUDENT_PROGRAM_REQUEST_STATUS_REQUESTED);
        studentProgramRequest.setRequestedAt(LocalDateTime.now());
        studentProgramRequest.setUpdatedByUser(updatedByUser);
        studentProgramRequestRepository.saveAndFlush(studentProgramRequest);

        return studentProgramTrackerService.getProgramsForStudent(studentId);
    }

    private StudentProgram resolveStudentProgramForRemoval(Long studentId, Long studentProgramId) {
        StudentProgram studentProgram = resolveExploredStudentProgram(
                studentId,
                studentProgramId,
                "Only explored programs can be removed by the student."
        );
        List<StudentProgramRequest> requests =
                studentProgramRequestRepository.findRequestsForStudentProgram(studentProgram.getId());
        if (requests.isEmpty()) {
            return studentProgram;
        }

        StudentProgramRequest latestRequest = requests.get(0);
        if (latestRequest.getStatus() != null
                && STUDENT_PROGRAM_REQUEST_STATUS_REJECTED.equalsIgnoreCase(latestRequest.getStatus())) {
            return studentProgram;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only previews without a submitted request or previews with a rejected request can be removed."
        );
    }

    private void detachProgramRequestsFromStudentProgram(
            StudentProgram studentProgram,
            SisUser updatedByUser
    ) {
        List<StudentProgramRequest> requests =
                studentProgramRequestRepository.findRequestsForStudentProgram(studentProgram.getId());
        if (requests.isEmpty()) {
            return;
        }

        requests.forEach(request -> {
            request.setStudentProgram(null);
            request.setUpdatedByUser(updatedByUser);
        });
        studentProgramRequestRepository.saveAllAndFlush(requests);
    }

    private StudentProgram resolveExploredStudentProgram(
            Long studentId,
            Long studentProgramId,
            String invalidStatusMessage
    ) {
        StudentProgram studentProgram = studentProgramRepository.findById(studentProgramId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student program was not found."));

        if (studentProgram.getStudent() == null || !studentId.equals(studentProgram.getStudent().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student program was not found.");
        }

        if (!STUDENT_PROGRAM_STATUS_EXPLORING.equalsIgnoreCase(studentProgram.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    invalidStatusMessage
            );
        }

        return studentProgram;
    }

    private SisUser resolveUpdatedByUser(Long updatedByUserId) {
        if (updatedByUserId == null) {
            return null;
        }

        return sisUserRepository.findById(updatedByUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Updated by user was not found."));
    }
}
