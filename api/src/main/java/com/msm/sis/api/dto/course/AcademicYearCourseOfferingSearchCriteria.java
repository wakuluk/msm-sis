package com.msm.sis.api.dto.course;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AcademicYearCourseOfferingSearchCriteria {
    private Long termId;
    private Long schoolId;
    private Long departmentId;
    private Long subjectId;
    private String courseCode;
    private String title;
    private String sortBy = "courseCode";
    private String sortDirection = "asc";
    private Integer page = 0;
    private Integer size = 25;
}
