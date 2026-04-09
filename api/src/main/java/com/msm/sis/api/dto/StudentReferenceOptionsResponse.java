package com.msm.sis.api.dto;

import java.util.List;

public record StudentReferenceOptionsResponse(
        List<ReferenceOptionResponse> genders,
        List<ReferenceOptionResponse> ethnicities,
        List<ReferenceOptionResponse> classStandings
) {
}
