package com.msm.sis.api.dto.student.affiliation;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatchStudentAthleteRequest {
    private PatchValue<Long> athleticSportId = PatchValue.absent();
    private PatchValue<Boolean> active = PatchValue.absent();
}
