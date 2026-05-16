package com.msm.sis.api.dto.billing;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatchTuitionCodeRequest {
    private PatchValue<String> code = PatchValue.absent();
    private PatchValue<String> name = PatchValue.absent();
}

