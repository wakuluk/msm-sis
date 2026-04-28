package com.msm.sis.api.dto.course;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CourseSectionStudentResponse(
        Long enrollmentId,
        Long sectionId,
        Long studentId,
        String studentDisplayName,
        String firstName,
        String lastName,
        String preferredName,
        String email,
        String classStanding,
        Long statusId,
        String statusCode,
        String statusName,
        Long gradingBasisId,
        String gradingBasisCode,
        String gradingBasisName,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate enrollmentDate,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime registeredAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime waitlistedAt,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate dropDate,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate withdrawDate,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime statusChangedAt,
        Long statusChangedByUserId,
        String statusChangedByEmail,
        BigDecimal creditsAttempted,
        BigDecimal creditsEarned,
        Integer waitlistPosition,
        boolean includeInGpa,
        boolean capacityOverride,
        String manualAddReason,
        CourseSectionStudentGradeResponse currentMidtermGrade,
        CourseSectionStudentGradeResponse currentFinalGrade,
        List<CourseSectionStudentGradeResponse> grades
) {
}
