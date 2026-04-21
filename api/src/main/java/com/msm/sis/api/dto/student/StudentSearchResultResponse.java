package com.msm.sis.api.dto.student;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record StudentSearchResultResponse(
        Long studentId,
        String firstName,
        String lastName,
        Integer classOf,
        String classStanding,
        String addressLine1,
        String addressLine2,
        String city,
        String stateRegion,
        String postalCode,
        String countryCode,
        boolean disabled,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime lastUpdated,
        String updatedBy
) {
}
