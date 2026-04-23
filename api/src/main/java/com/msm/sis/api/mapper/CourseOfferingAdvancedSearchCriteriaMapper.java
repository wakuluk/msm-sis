package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.course.CourseOfferingSearchCriteria;
import com.msm.sis.api.dto.course.CourseOfferingAdvancedSearchCriteria;
import org.springframework.stereotype.Component;

@Component
public class CourseOfferingAdvancedSearchCriteriaMapper {

    public CourseOfferingAdvancedSearchCriteria toCourseOfferingAdvancedSearchCriteria(
            CourseOfferingSearchCriteria publicCriteria
    ) {
        CourseOfferingAdvancedSearchCriteria criteria = new CourseOfferingAdvancedSearchCriteria();

        criteria.setAcademicYearCode(publicCriteria.getAcademicYearCode());
        criteria.setSubTermCode(publicCriteria.getSubTermCode());
        criteria.setDepartmentCode(publicCriteria.getDepartmentCode());
        criteria.setSubjectCode(publicCriteria.getSubjectCode());
        criteria.setCourseNumber(publicCriteria.getCourseNumber());
        criteria.setCourseCode(publicCriteria.getCourseCode());
        criteria.setTitle(publicCriteria.getTitle());
        criteria.setDescription(publicCriteria.getDescription());
        criteria.setMinCredits(publicCriteria.getMinCredits());
        criteria.setMaxCredits(publicCriteria.getMaxCredits());
        criteria.setVariableCredit(publicCriteria.getVariableCredit());

        return criteria;
    }
}
