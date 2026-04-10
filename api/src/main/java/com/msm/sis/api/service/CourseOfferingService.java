package com.msm.sis.api.service;

import com.msm.sis.api.dto.CourseOfferingDetailResponse;
import com.msm.sis.api.dto.CourseOfferingSearchCriteria;
import com.msm.sis.api.dto.CourseOfferingSearchResponse;
import com.msm.sis.api.dto.CourseOfferingSearchSortField;
import com.msm.sis.api.entity.CatalogCourseOffering;
import com.msm.sis.api.mapper.CourseMapper;
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

    private final CatalogCourseOfferingRepository catalogCourseOfferingRepository;
    private final CourseMapper courseMapper;

    public CourseOfferingService(
            CatalogCourseOfferingRepository catalogCourseOfferingRepository,
            CourseMapper courseMapper
    ) {
        this.catalogCourseOfferingRepository = catalogCourseOfferingRepository;
        this.courseMapper = courseMapper;
    }

    public CourseOfferingSearchResponse searchCourseOfferings(
            CourseOfferingSearchCriteria criteria,
            int page,
            int size,
            List<String> roles,
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
        validateIncludeInactiveAccess(includeInactive, roles);

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
                trimToNull(criteria.getOfferingStatusCode()),
                trimToNull(criteria.getTermStatusCode()),
                includeInactive,
                pageable
        );

        return courseMapper.toCourseOfferingSearchResponse(offeringsPage);
    }

    public CourseOfferingDetailResponse getCourseOfferingById(Long courseOfferingId, List<String> roles) {
        CatalogCourseOffering offering = catalogCourseOfferingRepository.findById(courseOfferingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (hasInactiveCatalogData(offering) && !canAccessInactiveCatalogData(roles)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return courseMapper.toCourseOfferingDetailResponse(offering);
    }

    private void validateIncludeInactiveAccess(boolean includeInactive, List<String> roles) {
        if (!includeInactive) {
            return;
        }

        if (canAccessInactiveCatalogData(roles)) {
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only admins and professors can include inactive catalog records."
        );
    }

    private boolean canAccessInactiveCatalogData(List<String> roles) {
        List<String> safeRoles = roles == null ? List.of() : roles;
        return safeRoles.contains("ADMIN") || safeRoles.contains("PROFESSOR");
    }

    private boolean hasInactiveCatalogData(CatalogCourseOffering offering) {
        return !offering.getCourseVersion().getCourse().getSubject().getDepartment().isActive()
                || !offering.getCourseVersion().getCourse().getSubject().isActive()
                || !offering.getCourseVersion().getCourse().isActive()
                || !offering.getCourseVersion().isActive()
                || !offering.getTerm().getAcademicYear().isActive()
                || !offering.getTerm().isActive()
                || !offering.getTerm().getStatus().isActive()
                || !offering.getStatus().isActive();
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
