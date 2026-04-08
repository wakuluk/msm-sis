package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.CreateStudentRequest;
import com.msm.sis.api.dto.StudentProfileResponse;
import com.msm.sis.api.entity.Address;
import com.msm.sis.api.entity.Student;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class StudentMapper {

    public Student fromCreateRequest(CreateStudentRequest request) {
        String firstName = trimToNull(request.firstName());
        String lastName = trimToNull(request.lastName());

        if (firstName == null || lastName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name and last name are required.");
        }

        Student student = new Student();
        student.setFirstName(firstName);
        student.setLastName(lastName);
        student.setMiddleName(trimToNull(request.middleName()));
        student.setNameSuffix(trimToNull(request.nameSuffix()));
        student.setGender(trimToNull(request.gender()));
        student.setEthnicityId(request.ethnicityId());
        student.setPreferredName(trimToNull(request.preferredName()));
        student.setDateOfBirth(request.dateOfBirth());
        student.setEstimatedGradDate(request.estimatedGradDate());
        student.setAltId(trimToNull(request.altId()));
        student.setEmail(trimToNull(request.email()));
        student.setPhone(trimToNull(request.phone()));
        student.setDisabled(false);
        return student;
    }

    public StudentProfileResponse toStudentProfileResponse(Student student) {
        Address address = student.getAddress();

        return new StudentProfileResponse(
                student.getId(),
                student.getLastName(),
                student.getFirstName(),
                student.getMiddleName(),
                student.getNameSuffix(),
                buildFullName(student),
                student.getGender(),
                student.getEthnicityId(),
                student.getEthnicity() == null ? null : student.getEthnicity().getName(),
                student.getClassStandingId(),
                student.getClassStanding() == null ? null : student.getClassStanding().getName(),
                student.getAddressId(),
                student.getPreferredName(),
                student.getDateOfBirth(),
                student.getEstimatedGradDate(),
                student.getEstimatedGradDate() == null ? null : student.getEstimatedGradDate().getYear(),
                student.getEmail(),
                student.getPhone(),
                address == null ? null : address.getAddressLine1(),
                address == null ? null : address.getAddressLine2(),
                address == null ? null : address.getCity(),
                address == null ? null : address.getStateRegion(),
                address == null ? null : address.getPostalCode(),
                address == null ? null : address.getCountryCode()
        );
    }

    private String buildFullName(Student student) {
        StringBuilder fullName = new StringBuilder();
        appendFullNamePart(fullName, student.getFirstName());
        appendFullNamePart(fullName, student.getMiddleName());
        appendFullNamePart(fullName, student.getLastName());
        appendFullNamePart(fullName, student.getNameSuffix());
        return trimToNull(fullName.toString());
    }

    private void appendFullNamePart(StringBuilder fullName, String value) {
        String trimmedValue = trimToNull(value);
        if (trimmedValue == null) {
            return;
        }

        if (fullName.length() > 0) {
            fullName.append(' ');
        }

        fullName.append(trimmedValue);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }
}
