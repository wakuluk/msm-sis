package com.msm.sis.api.dto.registration;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class PatchRegistrationGroupRequest {
    private PatchValue<String> name = PatchValue.absent();
    private PatchValue<Long> academicYearId = PatchValue.absent();
    private PatchValue<Long> termId = PatchValue.absent();
    private PatchValue<LocalDateTime> registrationOpensAt = PatchValue.absent();
    private PatchValue<LocalDateTime> registrationClosesAt = PatchValue.absent();
    private PatchValue<String> status = PatchValue.absent();
}
