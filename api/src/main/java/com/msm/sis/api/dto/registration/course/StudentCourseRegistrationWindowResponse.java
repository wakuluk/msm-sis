package com.msm.sis.api.dto.registration.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

public record StudentCourseRegistrationWindowResponse(
        Long registrationGroupId,
        Long academicYearId,
        String academicYearCode,
        String academicYearName,
        Long termId,
        String termCode,
        String termName,
        String statusCode,
        String statusName,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime registrationOpensAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime registrationClosesAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime serverTime,
        boolean registrationWindowOpen,
        List<StudentCourseRegistrationSubTermResponse> subTerms
) {
}
