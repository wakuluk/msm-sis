package com.msm.sis.api.validation;

import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.ClassStandingRepository;
import com.msm.sis.api.repository.EthnicityRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static com.msm.sis.api.util.TextUtils.trimToNull;

/**
 * Centralizes student validation so create and patch flows enforce the same
 * student rules without pushing that logic into StudentService or StudentMapper.
 */
@Component
public class StudentValidator {

    private final ClassStandingRepository classStandingRepository;
    private final EthnicityRepository ethnicityRepository;

    public StudentValidator(
            ClassStandingRepository classStandingRepository,
            EthnicityRepository ethnicityRepository
    ) {
        this.classStandingRepository = classStandingRepository;
        this.ethnicityRepository = ethnicityRepository;
    }

    public void validate(Student student) {
        if (trimToNull(student.getFirstName()) == null || trimToNull(student.getLastName()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name and last name are required.");
        }

        ValidationUtils.validateMaxLength(student.getLastName(), 50, "Last name");
        ValidationUtils.validateMaxLength(student.getFirstName(), 50, "First name");
        ValidationUtils.validateMaxLength(student.getMiddleName(), 50, "Middle name");
        ValidationUtils.validateMaxLength(student.getNameSuffix(), 10, "Name suffix");
        ValidationUtils.validateMaxLength(student.getGender(), 50, "Gender");
        ValidationUtils.validateMaxLength(student.getPreferredName(), 255, "Preferred name");
        ValidationUtils.validateMaxLength(student.getAltId(), 50, "Alt ID");
        ValidationUtils.validateMaxLength(student.getEmail(), 255, "Email");
        ValidationUtils.validateMaxLength(student.getPhone(), 30, "Phone");

        if (student.getDateOfBirth() != null && student.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future.");
        }

        if (student.getEthnicityId() != null && !ethnicityRepository.existsById(student.getEthnicityId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ethnicity ID does not exist.");
        }

        if (student.getClassStandingId() != null && !classStandingRepository.existsById(student.getClassStandingId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class standing ID does not exist.");
        }
    }
}
