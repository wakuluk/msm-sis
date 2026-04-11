package com.msm.sis.api.service;

import com.msm.sis.api.dto.*;
import com.msm.sis.api.entity.CatalogCourseOffering;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.mapper.CourseOfferingAdvancedSearchCriteriaMapper;
import com.msm.sis.api.repository.CatalogCourseOfferingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class CourseOfferingService {

    private final List<String> publicTermStatusCodes = List.of(
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
            "ACTIVE",
            "COMPLETED");

    private final List<String> publicOfferingStatusCodes = List.of(
            "OPEN_FOR_DISPLAY",
            "OPEN_FOR_REGISTRATION",
            "CLOSED");

    private final CatalogCourseOfferingRepository catalogCourseOfferingRepository;
    private final CourseMapper courseMapper;
    private final CourseOfferingAdvancedSearchCriteriaMapper courseOfferingSearchCriteriaMapper;

    public CourseOfferingService(
            CatalogCourseOfferingRepository catalogCourseOfferingRepository,
            CourseMapper courseMapper,
            CourseOfferingAdvancedSearchCriteriaMapper courseOfferingSearchCriteriaMapper
    ) {
        this.catalogCourseOfferingRepository = catalogCourseOfferingRepository;
        this.courseMapper = courseMapper;
        this.courseOfferingSearchCriteriaMapper = courseOfferingSearchCriteriaMapper;
    }

    public CourseOfferingSearchResponse searchPublicCourseOfferings(
            CourseOfferingSearchCriteria criteria,
            int page,
            int size,
            CourseOfferingSearchSortField sortField,
            Sort.Direction sortDirection
    ) {
        CourseOfferingAdvancedSearchCriteria courseOfferingAdvancedSearchCriteria = courseOfferingSearchCriteriaMapper.toCourseOfferingAdvancedSearchCriteria(criteria);

        courseOfferingAdvancedSearchCriteria.setIncludeInactive(true);
        courseOfferingAdvancedSearchCriteria.setIsPublished(true);
        courseOfferingAdvancedSearchCriteria.setTermStatusCodes(publicTermStatusCodes);
        courseOfferingAdvancedSearchCriteria.setOfferingStatusCodes(publicOfferingStatusCodes);


        return searchCourseOfferings(
                courseOfferingAdvancedSearchCriteria,
                page,
                size,
                sortField,
                sortDirection
        );
    }

    public CourseOfferingSearchResponse searchCourseOfferings(
            CourseOfferingAdvancedSearchCriteria criteria,
            int page,
            int size,
            CourseOfferingSearchSortField sortField,
            Sort.Direction sortDirection
    ) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }

        boolean includeInactive = Boolean.TRUE.equals(criteria.getIncludeInactive());

        Pageable pageable = PageRequest.of(
                page,
                size,
                buildSearchSort(sortField, sortDirection)
        );

        Page<CatalogCourseOffering> offeringsPage = catalogCourseOfferingRepository.searchCourseOfferings(
                trimToNull(criteria.getAcademicYearCode()),
                trimToNull(criteria.getTermCode()),
                trimToNull(criteria.getDepartmentCode()),
                trimToNull(criteria.getSubjectCode()),
                trimToNull(criteria.getCourseNumber()),
                trimToNull(criteria.getCourseCode()),
                trimToNull(criteria.getTitle()),
                trimToNull(criteria.getDescription()),
                criteria.getMinCredits(),
                criteria.getMaxCredits(),
                criteria.getVariableCredit(),
                normalizeStatusCodes(criteria.getOfferingStatusCodes()),
                normalizeStatusCodes(criteria.getTermStatusCodes()),
                includeInactive,
                criteria.getIsPublished(),
                pageable
        );

        return courseMapper.toCourseOfferingSearchResponse(offeringsPage);
    }

    public CourseOfferingDetailResponse getCourseOfferingById(Long courseOfferingId) {
        CatalogCourseOffering offering = catalogCourseOfferingRepository.findById(courseOfferingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return courseMapper.toCourseOfferingDetailResponse(offering);
    }

    public CourseOfferingDetailResponse getPublicCourseOfferingById(Long courseOfferingId) {
        CatalogCourseOffering offering = catalogCourseOfferingRepository.findPublicVisibleById(
                        courseOfferingId,
                        publicOfferingStatusCodes,
                        publicTermStatusCodes
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return courseMapper.toCourseOfferingDetailResponse(offering);
    }

    private List<String> normalizeStatusCodes(List<String> statusCodes) {
        if (statusCodes == null || statusCodes.isEmpty()) {
            return List.of();
        }

        return statusCodes.stream()
                .map(com.msm.sis.api.util.TextUtils::trimToNull)
                .filter(java.util.Objects::nonNull)
                .map(statusCode -> statusCode.toUpperCase(java.util.Locale.ROOT))
                .toList();
    }

    private Sort buildSearchSort(CourseOfferingSearchSortField sortField, Sort.Direction sortDirection) {
        return sortField.toSort(sortDirection)
                .and(Sort.by("term.sortOrder").ascending())
                .and(Sort.by("courseVersion.course.subject.code").ascending())
                .and(Sort.by("courseVersion.course.courseNumber").ascending())
                .and(Sort.by("courseVersion.versionNumber").descending())
                .and(Sort.by("id").ascending());
    }
}
