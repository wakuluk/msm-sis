package com.msm.sis.api.dto.registration;

import java.util.List;

public record RegistrationGroupSearchResponse(
        RegistrationGroupSearchPageResponse page,
        List<RegistrationGroupSearchResultResponse> results
) {
}
