package com.msm.sis.api.dto.athletics;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatchAthleticSportRequest {
    private PatchValue<String> code = PatchValue.absent();
    private PatchValue<String> name = PatchValue.absent();
    private PatchValue<Boolean> active = PatchValue.absent();
}
