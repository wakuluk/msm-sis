package com.msm.sis.api.service.academic;

import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicSubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
public class AcademicDepartmentValidationService {

    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicSubjectRepository academicSubjectRepository;

    public AcademicDepartmentValidationService(
            AcademicDepartmentRepository academicDepartmentRepository,
            AcademicSubjectRepository academicSubjectRepository
    ) {
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.academicSubjectRepository = academicSubjectRepository;
    }

    public void validatePatchAcademicDepartment(
            AcademicDepartment existingAcademicDepartment,
            AcademicDepartment candidateAcademicDepartment
    ) {
        String candidateCode = trimToNull(candidateAcademicDepartment.getCode());
        String candidateName = trimToNull(candidateAcademicDepartment.getName());

        if (candidateCode == null || candidateName == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic department code and name are required."
            );
        }

        validateMaxLength(candidateCode, 20, "Academic department code");
        validateMaxLength(candidateName, 255, "Academic department name");

        String existingCode = trimToNull(existingAcademicDepartment.getCode());
        if (!Objects.equals(existingCode, candidateCode)
                && academicDepartmentRepository.existsByCode(candidateCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic department code already exists."
            );
        }
    }

    public void validateCreateAcademicSubject(
            String candidateCode,
            String candidateName
    ) {
        if (candidateCode == null || candidateName == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic subject code and name are required."
            );
        }

        validateMaxLength(candidateCode, 20, "Academic subject code");
        validateMaxLength(candidateName, 255, "Academic subject name");

        if (academicSubjectRepository.existsByCode(candidateCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic subject code already exists."
            );
        }
    }
}
