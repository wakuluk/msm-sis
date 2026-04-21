package com.msm.sis.api.dto.academic.year;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AcademicYearSearchCriteria {

    // 🔍 Text search (name/code)
    private String query;

    // 🎛️ Filters
    private String yearStatusCode;
    private Boolean currentOnly;   // true = only current year

    // ↕️ Sorting
    private String sortBy = "startDate";   // default
    private String sortDirection = "desc";

    // 📄 Pagination
    private Integer page = 0;
    private Integer size = 25;

    // getters/setters
}
