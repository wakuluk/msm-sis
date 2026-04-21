package com.msm.sis.api.dto.academic.school;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AcademicSchoolDepartmentSearchCriteria {
    private Long schoolId;
    private Long departmentId;
    private String sortBy = "schoolName";
    private String sortDirection = "asc";
}
