package com.msm.sis.api.dto.registration;

import java.util.List;

public record RegistrationGroupPublishValidationResponse(
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        boolean publishable,
        int groupCount,
        int draftGroupCount,
        int alreadyPublishedGroupCount,
        int blockingIssueCount,
        List<RegistrationGroupPublishGroupResponse> groups,
        List<RegistrationGroupPublishValidationIssueResponse> issues
) {
}
