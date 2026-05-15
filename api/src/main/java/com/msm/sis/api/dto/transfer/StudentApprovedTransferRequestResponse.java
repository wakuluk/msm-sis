package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

public record StudentApprovedTransferRequestResponse(
        Long transferRequestId,
        String institutionName,
        String institutionLevel,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime submittedAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime approvedAt,
        List<StudentApprovedTransferRequestCourseResponse> courses
) {
}
