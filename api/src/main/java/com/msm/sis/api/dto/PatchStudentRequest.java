package com.msm.sis.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PatchStudentRequest {
    private PatchValue<String> lastName = PatchValue.absent();
    private PatchValue<String> firstName = PatchValue.absent();
    private PatchValue<String> middleName = PatchValue.absent();
    private PatchValue<String> nameSuffix = PatchValue.absent();
    private PatchValue<Integer> genderId = PatchValue.absent();
    private PatchValue<Integer> ethnicityId = PatchValue.absent();
    private PatchValue<Integer> classStandingId = PatchValue.absent();
    private PatchValue<String> preferredName = PatchValue.absent();
    @JsonFormat(pattern = "yyyy-MM-dd")
    private PatchValue<LocalDate> dateOfBirth = PatchValue.absent();
    @JsonFormat(pattern = "yyyy-MM-dd")
    private PatchValue<LocalDate> estimatedGradDate = PatchValue.absent();
    private PatchValue<String> altId = PatchValue.absent();
    private PatchValue<String> email = PatchValue.absent();
    private PatchValue<String> phone = PatchValue.absent();
    private PatchValue<Boolean> disabled = PatchValue.absent();
    private PatchValue<String> addressLine1 = PatchValue.absent();
    private PatchValue<String> addressLine2 = PatchValue.absent();
    private PatchValue<String> city = PatchValue.absent();
    private PatchValue<String> stateRegion = PatchValue.absent();
    private PatchValue<String> postalCode = PatchValue.absent();
    private PatchValue<String> countryCode = PatchValue.absent();
}
