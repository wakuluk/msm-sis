package com.msm.sis.api.dto.catalog;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class CourseOfferingSearchCriteria {
    private String academicYearCode;
    private String termCode;
    private String departmentCode;
    private String subjectCode;
    private String courseNumber;
    private String courseCode;
    private String title;
    private String description;
    private BigDecimal minCredits;
    private BigDecimal maxCredits;
    private Boolean variableCredit;
}

