package com.msm.sis.api.dto.course;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PatchCourseSectionStudentEnrollmentRequest {
    private PatchValue<String> statusCode = PatchValue.absent();
    private PatchValue<String> gradingBasisCode = PatchValue.absent();
    private PatchValue<BigDecimal> creditsAttempted = PatchValue.absent();
    private PatchValue<BigDecimal> creditsEarned = PatchValue.absent();
    private PatchValue<Integer> waitlistPosition = PatchValue.absent();
    private PatchValue<Boolean> includeInGpa = PatchValue.absent();
    private PatchValue<Boolean> capacityOverride = PatchValue.absent();
    private PatchValue<String> manualAddReason = PatchValue.absent();
    private PatchValue<String> reason = PatchValue.absent();
}
