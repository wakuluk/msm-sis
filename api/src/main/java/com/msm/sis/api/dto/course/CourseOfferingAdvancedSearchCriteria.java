package com.msm.sis.api.dto.course;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CourseOfferingAdvancedSearchCriteria extends CourseOfferingSearchCriteria {
    private List<String> subTermStatusCodes;
    private Boolean includeInactive;
    private Boolean isPublished;
}
