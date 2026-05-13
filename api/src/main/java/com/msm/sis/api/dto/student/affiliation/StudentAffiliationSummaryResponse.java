package com.msm.sis.api.dto.student.affiliation;

import java.util.List;

public record StudentAffiliationSummaryResponse(
        Long studentId,
        StudentHonorsStatusResponse honors,
        List<StudentAthleteStatusResponse> athletics
) {
}
