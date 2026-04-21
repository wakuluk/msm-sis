package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.course.CourseOfferingDetailResponse;
import com.msm.sis.api.dto.course.CourseOfferingSearchResponse;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.dto.course.CourseResponse;
import com.msm.sis.api.dto.course.CourseSearchResponse;
import com.msm.sis.api.dto.course.CourseSearchResultResponse;
import com.msm.sis.api.dto.course.CourseVersionDetailResponse;
import com.msm.sis.api.dto.course.CourseVersionSearchResponse;
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

    public CourseResponse toCourseResponse(Course course) {
        return toCourseResponse(course, null);
    }

    public CourseResponse toCourseResponse(Course course, String currentVersionTitle) {
        return new CourseResponse(
                course.getId(),
                course.getSubject() == null ? null : course.getSubject().getId(),
                course.getCourseNumber(),
                currentVersionTitle,
                course.isActive()
        );
    }

    public CourseVersionDetailResponse toCourseVersionDetailResponse(CourseVersion courseVersion) {
        Course course = courseVersion.getCourse();

        return new CourseVersionDetailResponse(
                courseVersion.getId(),
                course == null ? null : course.getId(),
                course == null || course.getSubject() == null ? null : course.getSubject().getId(),
                course == null || course.getSubject() == null ? null : course.getSubject().getCode(),
                course == null ? null : course.getCourseNumber(),
                course == null ? null : buildCourseCode(course),
                courseVersion.getVersionNumber(),
                courseVersion.getTitle(),
                courseVersion.getCatalogDescription(),
                courseVersion.getMinCredits(),
                courseVersion.getMaxCredits(),
                courseVersion.isVariableCredit(),
                courseVersion.isCurrentVersion(),
                courseVersion.getCreatedAt(),
                courseVersion.getUpdatedAt()
        );
    }

    public CourseVersionSearchResponse toCourseVersionSearchResponse(
            Page<CourseVersion> courseVersionsPage,
            Course course
    ) {
        return new CourseVersionSearchResponse(
                course.getId(),
                course.getSubject() == null ? null : course.getSubject().getId(),
                course.getSubject() == null ? null : course.getSubject().getCode(),
                course.getCourseNumber(),
                buildCourseCode(course),
                courseVersionsPage.getContent().stream().map(this::toCourseVersionDetailResponse).toList(),
                courseVersionsPage.getNumber(),
                courseVersionsPage.getSize(),
                courseVersionsPage.getTotalElements(),
                courseVersionsPage.getTotalPages()
        );
    }

    public CourseSearchResultResponse toCourseSearchResultResponse(
            Course course,
            CourseVersion currentCourseVersion
    ) {
        return new CourseSearchResultResponse(
                course.getId(),
                course.getSubject() == null || course.getSubject().getDepartment() == null || course.getSubject().getDepartment().getSchool() == null
                        ? null
                        : course.getSubject().getDepartment().getSchool().getId(),
                course.getSubject() == null || course.getSubject().getDepartment() == null || course.getSubject().getDepartment().getSchool() == null
                        ? null
                        : course.getSubject().getDepartment().getSchool().getCode(),
                course.getSubject() == null || course.getSubject().getDepartment() == null || course.getSubject().getDepartment().getSchool() == null
                        ? null
                        : course.getSubject().getDepartment().getSchool().getName(),
                course.getSubject() == null || course.getSubject().getDepartment() == null
                        ? null
                        : course.getSubject().getDepartment().getId(),
                course.getSubject() == null || course.getSubject().getDepartment() == null
                        ? null
                        : course.getSubject().getDepartment().getCode(),
                course.getSubject() == null || course.getSubject().getDepartment() == null
                        ? null
                        : course.getSubject().getDepartment().getName(),
                course.getSubject() == null ? null : course.getSubject().getId(),
                course.getSubject() == null ? null : course.getSubject().getCode(),
                course.getSubject() == null ? null : course.getSubject().getName(),
                course.getCourseNumber(),
                buildCourseCode(course),
                currentCourseVersion == null ? null : currentCourseVersion.getId(),
                currentCourseVersion == null ? null : currentCourseVersion.getTitle(),
                currentCourseVersion == null ? null : currentCourseVersion.getMinCredits(),
                currentCourseVersion == null ? null : currentCourseVersion.getMaxCredits(),
                currentCourseVersion != null && currentCourseVersion.isVariableCredit(),
                course.isActive()
        );
    }

    public CourseSearchResponse toCourseSearchResponse(
            java.util.List<CourseSearchResultResponse> results,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
        return new CourseSearchResponse(results, page, size, totalElements, totalPages);
    }

    private String buildCourseCode(Course course) {
        return course.getSubject().getCode() + course.getCourseNumber();
    }
}
