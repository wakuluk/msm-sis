package com.msm.sis.api.dto.academic.term;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class AcademicTermResponse {
    Long termId;
    String name;
    String code;
    Long academicYearId;
    LocalDate startDate;
    LocalDate endDate;
    List<AcademicSubTermResponse> subTerms;
}
