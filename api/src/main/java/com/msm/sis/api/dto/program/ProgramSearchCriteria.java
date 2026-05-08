package com.msm.sis.api.dto.program;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProgramSearchCriteria {
    private Long programTypeId;
    private Long degreeTypeId;
    private Long schoolId;
    private Long departmentId;
    private String code;
    private String name;
    private String sortBy = "code";
    private String sortDirection = "asc";
    private Integer page = 0;
    private Integer size = 25;
}
