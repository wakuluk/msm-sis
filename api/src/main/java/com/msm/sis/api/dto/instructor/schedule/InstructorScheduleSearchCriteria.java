package com.msm.sis.api.dto.instructor.schedule;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class InstructorScheduleSearchCriteria {
    private Long academicYearId;
    private Long termId;
    private List<Long> subTermIds = new ArrayList<>();
    private Long schoolId;
    private Long departmentId;
    private Long staffId;
    private String instructorSearch;
    private String courseSearch;
    private String statusCode;
    private String roleCode;
    private String deliveryModeCode;
    private String sortBy = "instructor";
    private String sortDirection = "asc";
    private Integer page = 0;
    private Integer size = 25;
}
