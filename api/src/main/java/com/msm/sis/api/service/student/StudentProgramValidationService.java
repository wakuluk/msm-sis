package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.program.ExploreStudentProgramRequest;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.repository.ProgramRepository;
import com.msm.sis.api.repository.ProgramVersionRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class StudentProgramValidationService {
    private static final String CORE_PROGRAM_TYPE_CODE = "CORE";
    private static final String STUDENT_PROGRAM_STATUS_REMOVED = "REMOVED";

    private final ProgramRepository programRepository;
    private final ProgramVersionRepository programVersionRepository;
    private final StudentProgramRepository studentProgramRepository;

    public ProgramVersion validateExploreStudentProgramRequest(
            Long studentId,
            ExploreStudentProgramRequest request
    ) {
        requirePositiveId(studentId, "Student id");
        requireRequestBody(request);
        Long programId = requirePositiveId(request.programId(), "Program id");
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program was not found."));

        validateProgramCanBeExplored(program);

        return resolveCurrentPublishedProgramVersion(programId);
    }

    public StudentProgram findCurrentStudentProgram(Long studentId, Long programId) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(programId, "Program id");

        return studentProgramRepository.findCurrentForStudentAndProgram(studentId, programId).stream()
                .findFirst()
                .orElse(null);
    }

    public StudentProgram findRemovedStudentProgramForReactivation(Long studentId, Long programId) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(programId, "Program id");

        return studentProgramRepository.findForStudentAndProgramIncludingRemoved(studentId, programId).stream()
                .filter(studentProgram -> STUDENT_PROGRAM_STATUS_REMOVED.equalsIgnoreCase(studentProgram.getStatus()))
                .findFirst()
                .orElse(null);
    }

    private void validateProgramCanBeExplored(Program program) {
        ProgramType programType = program.getProgramType();
        if (programType != null && CORE_PROGRAM_TYPE_CODE.equalsIgnoreCase(programType.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Core programs cannot be explored.");
        }
    }

    private ProgramVersion resolveCurrentPublishedProgramVersion(Long programId) {
        return programVersionRepository.findCurrentPublishedVersionsForProgram(programId).stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Program does not have a current published version."
                ));
    }
}
