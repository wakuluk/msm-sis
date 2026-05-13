package com.msm.sis.api.dto.registration;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationGroupSearchCriteria {
    private Long academicYearId;
    private Long termId;
    private String groupQuery;
    private String status;
    private Integer page = 0;
    private Integer size = 25;
    private String sortBy = "name";
    private String sortDirection = "asc";
}
