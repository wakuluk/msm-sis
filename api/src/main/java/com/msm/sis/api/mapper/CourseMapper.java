package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.CourseOfferingDetailResponse;
import com.msm.sis.api.dto.CourseOfferingSearchResponse;
import com.msm.sis.api.dto.CourseOfferingSearchResultResponse;
import com.msm.sis.api.entity.CatalogCourse;
import com.msm.sis.api.entity.CatalogCourseOffering;
import com.msm.sis.api.entity.CatalogCourseVersion;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    public CourseOfferingSearchResultResponse toCourseOfferingSearchResultResponse(CatalogCourseOffering offering) {
        CatalogCourseVersion courseVersion = offering.getCourseVersion();
        CatalogCourse course = courseVersion.getCourse();

        return new CourseOfferingSearchResultResponse(
                offering.getId(),
                course.getId(),
                courseVersion.getId(),
                offering.getTerm().getCode(),
                offering.getTerm().getName(),
                course.getSubject().getCode(),
                course.getCourseNumber(),
                buildCourseCode(course),
                courseVersion.getTitle(),
                courseVersion.getMinCredits(),
                courseVersion.getMaxCredits(),
                courseVersion.isVariableCredit(),
                offering.getStatus().getCode()
        );
    }

    public CourseOfferingDetailResponse toCourseOfferingDetailResponse(CatalogCourseOffering offering) {
        CatalogCourseVersion courseVersion = offering.getCourseVersion();
        CatalogCourse course = courseVersion.getCourse();

        return new CourseOfferingDetailResponse(
                offering.getId(),
                buildCourseCode(course),
                courseVersion.getTitle(),
                courseVersion.getCatalogDescription(),
                courseVersion.getMinCredits(),
                courseVersion.getMaxCredits(),
                courseVersion.isVariableCredit(),
                offering.getTerm().getCode(),
                offering.getTerm().getName(),
                offering.getStatus().getCode(),
                offering.getStatus().getName(),
                offering.getNotes()
        );
    }

    public CourseOfferingSearchResponse toCourseOfferingSearchResponse(Page<CatalogCourseOffering> offeringsPage) {
        return new CourseOfferingSearchResponse(
                offeringsPage.getContent().stream().map(this::toCourseOfferingSearchResultResponse).toList(),
                offeringsPage.getNumber(),
                offeringsPage.getSize(),
                offeringsPage.getTotalElements(),
                offeringsPage.getTotalPages()
        );
    }

    private String buildCourseCode(CatalogCourse course) {
        return course.getSubject().getCode() + course.getCourseNumber();
    }
}
