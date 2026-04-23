package com.msm.sis.api.dto.course;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PatchCourseOfferingRequest {
    private Long courseOfferingId;
    private PatchValue<List<Long>> subTermIds = PatchValue.absent();
    private PatchValue<String> offeringStatusCode = PatchValue.absent();
    private PatchValue<String> notes = PatchValue.absent();
}
