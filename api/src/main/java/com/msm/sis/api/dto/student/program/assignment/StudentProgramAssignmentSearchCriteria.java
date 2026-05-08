package com.msm.sis.api.dto.student.program.assignment;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentProgramAssignmentSearchCriteria {
    private Integer classStandingId;
    private Long degreeTypeId;
    private Long departmentId;
    private String programQuery;
    private Long programTypeId;
    private Long schoolId;
    private String status = "ACTIVE";
    private String studentQuery;
}
