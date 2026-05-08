package com.msm.sis.api.dto.student.program.request;

import java.time.LocalDateTime;
import java.util.List;

public record ProgramRequestQueueCriteria(
        List<String> statuses,
        String studentQuery,
        String programQuery,
        Long programTypeId,
        Long degreeTypeId,
        Long schoolId,
        Long departmentId,
        Long classStandingId,
        LocalDateTime requestedFrom,
        LocalDateTime requestedBefore
) {
}
