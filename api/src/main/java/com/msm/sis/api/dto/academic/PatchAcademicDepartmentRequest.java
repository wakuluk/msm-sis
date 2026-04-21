package com.msm.sis.api.dto.academic;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatchAcademicDepartmentRequest {
    private PatchValue<String> code = PatchValue.absent();
    private PatchValue<String> name = PatchValue.absent();
    private PatchValue<Boolean> active = PatchValue.absent();
}
