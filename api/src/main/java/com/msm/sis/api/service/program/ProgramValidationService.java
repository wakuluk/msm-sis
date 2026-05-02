package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.CreateProgramRequest;
import com.msm.sis.api.dto.program.CreateProgramVersionRequest;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.entity.DegreeType;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.repository.ProgramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class ProgramValidationService {
    private static final String MAJOR_PROGRAM_TYPE_CODE = "MAJOR";
    private static final String MASTERS_PROGRAM_TYPE_CODE = "MASTERS";
    private static final String MINOR_PROGRAM_TYPE_CODE = "MINOR";
    private static final String CERTIFICATE_PROGRAM_TYPE_CODE = "CERTIFICATE";
    private static final String CORE_PROGRAM_TYPE_CODE = "CORE";

    private final ProgramRepository programRepository;

    public void validateCreateProgramRequest(CreateProgramRequest request) {
        requireRequestBody(request);

        if (trimToNull(request.code()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program code is required.");
        }

        if (trimToNull(request.name()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program name is required.");
        }

        validateCreateProgramVersionRequest(request.initialVersion());
    }

    public void validateProgramCodeAvailable(String programCode) {
        if (programRepository.existsByCode(programCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A program with this code already exists."
            );
        }
    }

    public void validateDepartmentBelongsToSchool(
            AcademicDepartment department,
            AcademicSchool school
    ) {
        if (department == null) {
            return;
        }

        if (school == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Department id requires a selected school."
            );
        }

        if (department.getSchool() == null || !Objects.equals(department.getSchool().getId(), school.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Department id must belong to the selected school."
            );
        }
    }

    public void validateProgramTypeRelationships(
            ProgramType programType,
            AcademicSchool school,
            AcademicDepartment department,
            DegreeType degreeType
    ) {
        if (programType == null || programType.getCode() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program type id is invalid.");
        }

        String programTypeCode = programType.getCode();

        if (MAJOR_PROGRAM_TYPE_CODE.equals(programTypeCode)
                || MASTERS_PROGRAM_TYPE_CODE.equals(programTypeCode)) {
            if (school == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        programType.getName() + " programs require a school."
                );
            }

            if (degreeType == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        programType.getName() + " programs require a degree type."
                );
            }

            return;
        }

        if (MINOR_PROGRAM_TYPE_CODE.equals(programTypeCode)
                || CERTIFICATE_PROGRAM_TYPE_CODE.equals(programTypeCode)) {
            if (school == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        programType.getName() + " programs require a school."
                );
            }

            if (degreeType != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        programType.getName() + " programs cannot have a degree type."
                );
            }

            return;
        }

        if (CORE_PROGRAM_TYPE_CODE.equals(programTypeCode)) {
            if (school != null || department != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Core programs cannot be assigned to a school or department."
                );
            }
        }
    }

    private void validateCreateProgramVersionRequest(CreateProgramVersionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Initial version is required.");
        }

        if (request.classYearStart() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class year start is required.");
        }

        if (request.classYearEnd() != null && request.classYearEnd() < request.classYearStart()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Class year end must be greater than or equal to class year start."
            );
        }
    }
}
