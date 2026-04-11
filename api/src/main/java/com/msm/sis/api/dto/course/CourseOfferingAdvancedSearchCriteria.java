package com.msm.sis.api.dto.course;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CourseOfferingAdvancedSearchCriteria extends CourseOfferingSearchCriteria {
    private List<String> offeringStatusCodes;
    private List<String> termStatusCodes;
    private Boolean includeInactive;
    private Boolean isPublished;
}
