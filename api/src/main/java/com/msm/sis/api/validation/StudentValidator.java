package com.msm.sis.api.validation;

import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.ClassStandingRepository;
import com.msm.sis.api.repository.EthnicityRepository;
import com.msm.sis.api.repository.GenderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

/**
 * Centralizes student validation so create and patch flows enforce the same
 * student rules without pushing that logic into StudentService or StudentMapper.
 */
@Component
public class StudentValidator {

    private final ClassStandingRepository classStandingRepository;
    private final EthnicityRepository ethnicityRepository;
    private final GenderRepository genderRepository;

    public StudentValidator(
            ClassStandingRepository classStandingRepository,
            EthnicityRepository ethnicityRepository,
            GenderRepository genderRepository
    ) {
        this.classStandingRepository = classStandingRepository;
        this.ethnicityRepository = ethnicityRepository;
        this.genderRepository = genderRepository;
    }

    public void validate(Student student) {
        if (trimToNull(student.getFirstName()) == null || trimToNull(student.getLastName()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name and last name are required.");
        }

        validateMaxLength(student.getLastName(), 50, "Last name");
        validateMaxLength(student.getFirstName(), 50, "First name");
        validateMaxLength(student.getMiddleName(), 50, "Middle name");
        validateMaxLength(student.getNameSuffix(), 10, "Name suffix");
        validateMaxLength(student.getPreferredName(), 255, "Preferred name");
        validateMaxLength(student.getAltId(), 50, "Alt ID");
        validateMaxLength(student.getEmail(), 255, "Email");
        validateMaxLength(student.getPhone(), 30, "Phone");

        if (student.getDateOfBirth() != null && student.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future.");
        }

        if (student.getGenderId() != null && !genderRepository.existsById(student.getGenderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gender ID does not exist.");
        }

        if (student.getEthnicityId() != null && !ethnicityRepository.existsById(student.getEthnicityId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ethnicity ID does not exist.");
        }

        if (student.getClassStandingId() != null && !classStandingRepository.existsById(student.getClassStandingId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class standing ID does not exist.");
        }
    }
}
