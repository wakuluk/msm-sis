package com.msm.sis.api.dto.registration;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UnassignedRegistrationGroupStudentSearchCriteria {
    private Long academicYearId;
    private Long termId;
    private String searchText;
    private Integer page = 0;
    private Integer size = 25;
    private String sortBy = "student";
    private String sortDirection = "asc";
}
