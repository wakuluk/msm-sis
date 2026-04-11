package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.course.CourseOfferingDetailResponse;
import com.msm.sis.api.dto.course.CourseOfferingSearchResponse;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseVersion;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    public CourseOfferingSearchResultResponse toCourseOfferingSearchResultResponse(CourseOffering offering) {
        CourseVersion courseVersion = offering.getCourseVersion();
        Course course = courseVersion.getCourse();

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
                offering.getStatus().getCode(),
                offering.getStatus().getName()
        );
    }

    public CourseOfferingDetailResponse toCourseOfferingDetailResponse(CourseOffering offering) {
        CourseVersion courseVersion = offering.getCourseVersion();
        Course course = courseVersion.getCourse();

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

    public CourseOfferingSearchResponse toCourseOfferingSearchResponse(Page<CourseOffering> offeringsPage) {
        return new CourseOfferingSearchResponse(
                offeringsPage.getContent().stream().map(this::toCourseOfferingSearchResultResponse).toList(),
                offeringsPage.getNumber(),
                offeringsPage.getSize(),
                offeringsPage.getTotalElements(),
                offeringsPage.getTotalPages()
        );
    }

    private String buildCourseCode(Course course) {
        return course.getSubject().getCode() + course.getCourseNumber();
    }
}
