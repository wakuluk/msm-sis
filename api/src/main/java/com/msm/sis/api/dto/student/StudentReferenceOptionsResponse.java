package com.msm.sis.api.dto.student;

import com.msm.sis.api.dto.reference.ReferenceOptionResponse;

import java.util.List;

public record StudentReferenceOptionsResponse(
        List<ReferenceOptionResponse> genders,
        List<ReferenceOptionResponse> ethnicities,
        List<ReferenceOptionResponse> classStandings
) {
}
