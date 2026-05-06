package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.program.ExploreStudentProgramRequest;
import com.msm.sis.api.dto.student.program.StudentProgramsResponse;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentAcademicPlanCourseRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class StudentProgramExplorationService {
    private static final String STUDENT_PROGRAM_STATUS_EXPLORING = "EXPLORING";
    private static final String STUDENT_PROGRAM_STATUS_REMOVED = "REMOVED";
    private static final String STUDENT_PROGRAM_STATUS_REQUESTED = "REQUESTED";

    private final SisUserRepository sisUserRepository;
    private final StudentAcademicPlanCourseRepository studentAcademicPlanCourseRepository;
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

        studentProgram.setStatus(STUDENT_PROGRAM_STATUS_REQUESTED);
        studentProgram.setDeclaredDate(null);
        studentProgram.setCompletedDate(null);
        studentProgram.setUpdatedByUser(updatedByUser);
        studentProgramRepository.saveAndFlush(studentProgram);

        return studentProgramTrackerService.getProgramsForStudent(studentId);
    }

    private StudentProgram resolveStudentProgramForRemoval(Long studentId, Long studentProgramId) {
        return resolveExploredStudentProgram(
                studentId,
                studentProgramId,
                "Only explored programs can be removed by the student."
        );
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
