package com.msm.sis.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CourseOfferingSearchCriteria {
    @Schema(description = "Filter by academic year code.", example = "AY-2026-2027")
    private String academicYearCode;

    @Schema(description = "Filter by term code.", example = "FALL-2026")
    private String termCode;

    @Schema(description = "Filter by department code.", example = "HUM")
    private String departmentCode;

    @Schema(description = "Filter by subject code.", example = "TOLK")
    private String subjectCode;

    @Schema(description = "Search within the course number.", example = "101")
    private String courseNumber;

    @Schema(description = "Search within the combined course code.", example = "TOLK101")
    private String courseCode;

    @Schema(description = "Search within the course title.", example = "Tolkien")
    private String title;

    @Schema(description = "Search within the catalog description.", example = "Middle-earth")
    private String description;

    @Schema(description = "Minimum credits for matching offerings.", example = "3.00")
    private BigDecimal minCredits;

    @Schema(description = "Maximum credits for matching offerings.", example = "4.00")
    private BigDecimal maxCredits;

    @Schema(description = "Whether the course version uses variable credit.", example = "false")
    private Boolean variableCredit;

    @Schema(description = "Filter by offering status code.", example = "OPEN_FOR_REGISTRATION")
    private String offeringStatusCode;

    @Schema(description = "Filter by term status code.", example = "REGISTRATION_OPEN")
    private String termStatusCode;

    @Schema(description = "Include inactive catalog rows. Only admins and professors may set this to true.", example = "false")
    private Boolean includeInactive;
}
