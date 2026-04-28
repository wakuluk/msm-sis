package com.msm.sis.api.dto.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record CourseSectionStudentGradeResponse(
        Long gradeId,
        Long gradeTypeId,
        String gradeTypeCode,
        String gradeTypeName,
        Long gradeMarkId,
        String gradeMarkCode,
        String gradeMarkName,
        boolean current,
        Long postedByUserId,
        String postedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime postedAt
) {
}
