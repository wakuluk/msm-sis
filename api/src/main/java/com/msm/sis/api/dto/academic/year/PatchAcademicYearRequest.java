package com.msm.sis.api.dto.academic.year;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PatchAcademicYearRequest {
    private PatchValue<String> code = PatchValue.absent();
    private PatchValue<String> name = PatchValue.absent();
    @JsonFormat(pattern = "yyyy-MM-dd")
    private PatchValue<LocalDate> startDate = PatchValue.absent();
    @JsonFormat(pattern = "yyyy-MM-dd")
    private PatchValue<LocalDate> endDate = PatchValue.absent();
    private PatchValue<List<PatchAcademicYearTermRequest>> patchAcademicTermRequest = PatchValue.absent();
}
