package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.student.CreateStudentRequest;
import com.msm.sis.api.dto.student.PatchStudentRequest;
import com.msm.sis.api.dto.student.StudentDetailResponse;
import com.msm.sis.api.dto.student.StudentProfileResponse;
import com.msm.sis.api.dto.student.StudentSearchResponse;
import com.msm.sis.api.dto.student.StudentSearchResultResponse;
import com.msm.sis.api.entity.Address;
import com.msm.sis.api.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import static com.msm.sis.api.patch.PatchUtils.apply;
import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class StudentMapper {

    public Student fromCreateRequest(CreateStudentRequest request) {
        Student student = new Student();
        student.setFirstName(trimToNull(request.firstName()));
        student.setLastName(trimToNull(request.lastName()));
        student.setMiddleName(trimToNull(request.middleName()));
        student.setNameSuffix(trimToNull(request.nameSuffix()));
        student.setGenderId(request.genderId());
        student.setEthnicityId(request.ethnicityId());
        student.setClassStandingId(request.classStandingId());
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
                student.getGenderLookup() == null ? null : student.getGenderLookup().getName(),
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

    public StudentDetailResponse toStudentDetailResponse(Student student) {
        Address address = student.getAddress();

        return new StudentDetailResponse(
                student.getId(),
                student.getUserId(),
                student.getLastName(),
                student.getFirstName(),
                student.getMiddleName(),
                student.getNameSuffix(),
                buildFullName(student),
                student.getGenderId(),
                student.getGenderLookup() == null ? null : student.getGenderLookup().getName(),
                student.getEthnicityId(),
                student.getEthnicity() == null ? null : student.getEthnicity().getName(),
                student.getClassStandingId(),
                student.getClassStanding() == null ? null : student.getClassStanding().getName(),
                student.getAddressId(),
                student.getPreferredName(),
                student.getDateOfBirth(),
                student.getEstimatedGradDate(),
                student.getEstimatedGradDate() == null ? null : student.getEstimatedGradDate().getYear(),
                student.getAltId(),
                student.getEmail(),
                student.getPhone(),
                student.isDisabled(),
                student.getLastUpdated(),
                student.getUpdatedBy(),
                address == null ? null : address.getAddressLine1(),
                address == null ? null : address.getAddressLine2(),
                address == null ? null : address.getCity(),
                address == null ? null : address.getStateRegion(),
                address == null ? null : address.getPostalCode(),
                address == null ? null : address.getCountryCode()
        );
    }

    public StudentSearchResultResponse toStudentSearchResultResponse(Student student) {
        Address address = student.getAddress();

        return new StudentSearchResultResponse(
                student.getId(),
                student.getFirstName(),
                student.getLastName(),
                student.getEstimatedGradDate() == null ? null : student.getEstimatedGradDate().getYear(),
                student.getClassStanding() == null ? null : student.getClassStanding().getName(),
                address == null ? null : address.getAddressLine1(),
                address == null ? null : address.getAddressLine2(),
                address == null ? null : address.getCity(),
                address == null ? null : address.getStateRegion(),
                address == null ? null : address.getPostalCode(),
                address == null ? null : address.getCountryCode(),
                student.isDisabled(),
                student.getLastUpdated(),
                student.getUpdatedBy()
        );
    }

    public StudentSearchResponse toStudentSearchResponse(Page<Student> studentsPage) {
        return new StudentSearchResponse(
                studentsPage.getContent().stream().map(this::toStudentSearchResultResponse).toList(),
                studentsPage.getNumber(),
                studentsPage.getSize(),
                studentsPage.getTotalElements(),
                studentsPage.getTotalPages()
        );
    }

    public void applyPatch(Student student, PatchStudentRequest request) {
        applyTrimmed(request.getLastName(), student::setLastName);
        applyTrimmed(request.getFirstName(), student::setFirstName);
        applyTrimmed(request.getMiddleName(), student::setMiddleName);
        applyTrimmed(request.getNameSuffix(), student::setNameSuffix);
        apply(request.getGenderId(), student::setGenderId);
        apply(request.getEthnicityId(), student::setEthnicityId);
        apply(request.getClassStandingId(), student::setClassStandingId);
        applyTrimmed(request.getPreferredName(), student::setPreferredName);
        apply(request.getDateOfBirth(), student::setDateOfBirth);
        apply(request.getEstimatedGradDate(), student::setEstimatedGradDate);
        applyTrimmed(request.getAltId(), student::setAltId);
        applyTrimmed(request.getEmail(), student::setEmail);
        applyTrimmed(request.getPhone(), student::setPhone);
        apply(request.getDisabled(), student::setDisabled);
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

}
