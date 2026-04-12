package com.msm.sis.api.dto.academic.year;
import java.time.LocalDate;


public record AcademicYearSearchResponse(
    Long academicYearId,
    String code,
    String name,
    LocalDate startDate,
    LocalDate endDate,
    boolean active,
    boolean isPublished
){

}
