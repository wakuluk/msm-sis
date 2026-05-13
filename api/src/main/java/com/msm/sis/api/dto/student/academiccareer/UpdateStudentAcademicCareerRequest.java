package com.msm.sis.api.dto.student.academiccareer;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateStudentAcademicCareerRequest {
    private PatchValue<Long> academicCareerId = PatchValue.absent();
    private PatchValue<String> status = PatchValue.absent();

    @JsonFormat(pattern = "yyyy-MM-dd")
    private PatchValue<LocalDate> effectiveStartDate = PatchValue.absent();

    @JsonFormat(pattern = "yyyy-MM-dd")
    private PatchValue<LocalDate> effectiveEndDate = PatchValue.absent();

    private PatchValue<Boolean> primaryCareer = PatchValue.absent();
    private PatchValue<String> entryReason = PatchValue.absent();
    private PatchValue<String> notes = PatchValue.absent();
}
