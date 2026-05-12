package com.msm.sis.api.dto.athletics;

import java.util.List;

public record AthleticSportListResponse(
        List<AthleticSportResponse> sports
) {
}
