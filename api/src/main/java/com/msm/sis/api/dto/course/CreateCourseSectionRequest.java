package com.msm.sis.api.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateCourseSectionRequest(
        @NotNull
        Long subTermId,

        @NotBlank
        @Size(max = 5)
        String sectionLetter,

        @Size(max = 255)
        String title,

        boolean honors,

        @Size(max = 50)
        String statusCode,

        @Size(max = 50)
        String academicDivisionCode,

        @NotBlank
        @Size(max = 50)
        String deliveryModeCode,

        @NotBlank
        @Size(max = 50)
        String gradingBasisCode,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal credits,

        @NotNull
        @Min(0)
        Integer capacity,

        @Min(0)
        Integer hardCapacity,

        boolean waitlistAllowed,

        LocalDate startDate,

        LocalDate endDate,

        @Size(max = 50)
        String linkedGroupCode,

        @Size(max = 500)
        String notes,

        List<@Valid CreateCourseSectionInstructorRequest> instructors,

        List<@Valid CreateCourseSectionMeetingRequest> meetings
) {
}
