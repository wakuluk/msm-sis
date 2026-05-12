package com.msm.sis.api.dto.registration;

import java.util.List;

public record RegistrationGroupDetailResponse(
        RegistrationGroupDetailSummaryResponse summary,
        RegistrationGroupRegistrationWindowResponse registrationWindow,
        RegistrationGroupSavedSearchCriteriaResponse searchCriteria,
        RegistrationGroupDetailCountsResponse counts,
        List<RegistrationGroupAssignedStudentResponse> students
) {
}
