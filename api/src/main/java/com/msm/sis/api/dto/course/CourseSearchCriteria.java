package com.msm.sis.api.dto.course;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseSearchCriteria {
    private Long schoolId;
    private Long departmentId;
    private Long subjectId;
    private String courseNumber;
    private String courseCode;
    private String title;
    private Boolean currentVersionOnly;
    private Boolean includeInactive;
    private String sortBy = "courseNumber";
    private String sortDirection = "asc";
    private Integer page = 0;
    private Integer size = 25;
}
