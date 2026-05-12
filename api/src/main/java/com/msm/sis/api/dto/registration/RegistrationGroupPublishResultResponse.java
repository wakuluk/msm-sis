package com.msm.sis.api.dto.registration;

import java.util.List;

public record RegistrationGroupPublishResultResponse(
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        int requestedGroupCount,
        int publishedGroupCount,
        int skippedGroupCount,
        List<RegistrationGroupPublishGroupResponse> groups
) {
}
