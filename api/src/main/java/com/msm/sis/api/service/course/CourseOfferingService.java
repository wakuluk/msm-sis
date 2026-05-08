package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.*;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.mapper.CourseOfferingAdvancedSearchCriteriaMapper;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.CourseOfferingRepository;
import com.msm.sis.api.repository.CourseOfferingSubTermRepository;
import com.msm.sis.api.repository.CourseRepository;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
public class CourseOfferingService {
    //TODO yea... we need a better solution than this.
    private final List<String> publicSubTermStatusCodes = List.of(
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
            "ACTIVE",
            "COMPLETED");

    private final CourseOfferingRepository courseOfferingRepository;
    private final CourseOfferingSubTermRepository courseOfferingSubTermRepository;
    private final AcademicYearCourseOfferingSearchService academicYearCourseOfferingSearchService;
    private final AcademicYearRepository academicYearRepository;
    private final CourseRepository courseRepository;
    private final CourseOfferingCatalogMaintenanceService courseOfferingCatalogMaintenanceService;
    private final CourseOfferingPatchService courseOfferingPatchService;
    private final CourseMapper courseMapper;
    private final CourseOfferingAdvancedSearchCriteriaMapper courseOfferingSearchCriteriaMapper;
    private final CourseOfferingSubTermService courseOfferingSubTermService;
    private final EntityManager entityManager;

    public CourseOfferingService(
            CourseOfferingRepository courseOfferingRepository,
            CourseOfferingSubTermRepository courseOfferingSubTermRepository,
            AcademicYearCourseOfferingSearchService academicYearCourseOfferingSearchService,
            AcademicYearRepository academicYearRepository,
            CourseRepository courseRepository,
            CourseOfferingCatalogMaintenanceService courseOfferingCatalogMaintenanceService,
            CourseOfferingPatchService courseOfferingPatchService,
            CourseMapper courseMapper,
            CourseOfferingAdvancedSearchCriteriaMapper courseOfferingSearchCriteriaMapper,
            CourseOfferingSubTermService courseOfferingSubTermService,
            EntityManager entityManager
    ) {
        this.courseOfferingRepository = courseOfferingRepository;
        this.courseOfferingSubTermRepository = courseOfferingSubTermRepository;
        this.academicYearCourseOfferingSearchService = academicYearCourseOfferingSearchService;
        this.academicYearRepository = academicYearRepository;
        this.courseRepository = courseRepository;
        this.courseOfferingCatalogMaintenanceService = courseOfferingCatalogMaintenanceService;
        this.courseOfferingPatchService = courseOfferingPatchService;
        this.courseMapper = courseMapper;
        this.courseOfferingSearchCriteriaMapper = courseOfferingSearchCriteriaMapper;
        this.courseOfferingSubTermService = courseOfferingSubTermService;
        this.entityManager = entityManager;
    }

    @Transactional
    public CourseOfferingDetailResponse createCourseOffering(
            Long academicYearId,
            CreateCourseOfferingRequest request
    ) {
        requirePositiveId(academicYearId, "Academic year id");

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Create course offering request is required."
            );
        }

        Long courseId = request.courseId();
        requirePositiveId(courseId, "Course id");

        List<Long> requestedSubTermIds = courseOfferingSubTermService.normalizeSubTermIds(request.subTermIds());
        if (requestedSubTermIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one academic sub term is required."
            );
        }

        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<AcademicSubTerm> academicSubTerms = courseOfferingSubTermService.getAcademicSubTermsForAcademicYear(
                academicYearId,
                requestedSubTermIds
        );
        CourseVersion currentCourseVersion = courseOfferingCatalogMaintenanceService.getCurrentCourseVersion(courseId);

        CourseOffering existingCourseOffering = courseOfferingRepository
                .findByCourseIdAndAcademicYearId(courseId, academicYearId)
                .orElse(null);
        if (existingCourseOffering != null) {
            List<Long> existingSubTermIds = existingCourseOffering.getCourseOfferingSubTerms().stream()
                    .map(CourseOfferingSubTerm::getSubTerm)
                    .filter(Objects::nonNull)
                    .map(AcademicSubTerm::getId)
                    .toList();
            List<AcademicSubTerm> missingAcademicSubTerms = academicSubTerms.stream()
                    .filter(academicSubTerm -> !existingSubTermIds.contains(academicSubTerm.getId()))
                    .toList();

            if (missingAcademicSubTerms.isEmpty()) {
                return getCourseOfferingById(existingCourseOffering.getId());
            }

            List<CourseOfferingSubTerm> courseOfferingSubTerms = missingAcademicSubTerms.stream()
                    .map(academicSubTerm -> courseOfferingSubTermService.buildCourseOfferingSubTerm(
                            existingCourseOffering,
                            existingCourseOffering.getAcademicYear(),
                            academicSubTerm
                    ))
                    .toList();

            courseOfferingSubTermRepository.saveAllAndFlush(courseOfferingSubTerms);
            entityManager.clear();
            return getCourseOfferingById(existingCourseOffering.getId());
        }

        CourseOffering courseOffering = new CourseOffering();
        courseOffering.setAcademicYear(academicYear);
        courseOffering.setCourseVersion(currentCourseVersion);
        courseOffering.setNotes(trimToNull(request.notes()));

        CourseOffering savedCourseOffering = courseOfferingRepository.saveAndFlush(courseOffering);

        List<CourseOfferingSubTerm> courseOfferingSubTerms = academicSubTerms.stream()
                .map(academicSubTerm -> courseOfferingSubTermService.buildCourseOfferingSubTerm(
                        savedCourseOffering,
                        academicYear,
                        academicSubTerm
                ))
                .toList();

        courseOfferingSubTermRepository.saveAllAndFlush(courseOfferingSubTerms);
        entityManager.clear();

        return getCourseOfferingById(savedCourseOffering.getId());
    }

    @Transactional
    public ImportAcademicYearCourseOfferingsResponse importCurrentCourseVersionsIntoAcademicYear(
            Long academicYearId
    ) {
        return courseOfferingCatalogMaintenanceService.importCurrentCourseVersionsIntoAcademicYear(academicYearId);
    }

    @Transactional
    public SyncAcademicYearCourseOfferingsResponse syncAcademicYearCourseOfferingsToCurrentCourseVersions(
            Long academicYearId
    ) {
        return courseOfferingCatalogMaintenanceService.syncAcademicYearCourseOfferingsToCurrentCourseVersions(academicYearId);
    }

    @Transactional
    public CourseOfferingDetailResponse patchCourseOffering(
            Long courseOfferingId,
            PatchCourseOfferingRequest request
    ) {
        courseOfferingPatchService.patchCourseOffering(courseOfferingId, request);
        return getCourseOfferingById(courseOfferingId);
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
        courseOfferingAdvancedSearchCriteria.setSubTermStatusCodes(publicSubTermStatusCodes);

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
        validatePageRequest(page, size, 100);

        boolean includeInactive = Boolean.TRUE.equals(criteria.getIncludeInactive());

        Pageable pageable = PageRequest.of(
                page,
                size,
                buildSearchSort(sortField, sortDirection)
        );

        Page<CourseOffering> offeringsPage = courseOfferingRepository.searchCourseOfferings(
                trimToNull(criteria.getAcademicYearCode()),
                trimToNull(criteria.getSubTermCode()),
                trimToNull(criteria.getDepartmentCode()),
                trimToNull(criteria.getSubjectCode()),
                trimToNull(criteria.getCourseNumber()),
                trimToNull(criteria.getCourseCode()),
                trimToNull(criteria.getTitle()),
                trimToNull(criteria.getDescription()),
                criteria.getMinCredits(),
                criteria.getMaxCredits(),
                criteria.getVariableCredit(),
                normalizeStatusCodes(criteria.getSubTermStatusCodes()),
                includeInactive,
                criteria.getIsPublished(),
                pageable
        );

        return courseMapper.toCourseOfferingSearchResponse(offeringsPage);
    }

    public CourseOfferingDetailResponse getCourseOfferingById(Long courseOfferingId) {
        CourseOffering offering = courseOfferingRepository.findById(courseOfferingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return courseMapper.toCourseOfferingDetailResponse(offering);
    }

    public AcademicYearCourseOfferingSearchResponse searchAcademicYearCourseOfferings(
            Long academicYearId,
            AcademicYearCourseOfferingSearchCriteria criteria
    ) {
        requirePositiveId(academicYearId, "Academic year id");

        academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return academicYearCourseOfferingSearchService.search(academicYearId, criteria);
    }

    public CourseOfferingDetailResponse getPublicCourseOfferingById(Long courseOfferingId) {
        CourseOffering offering = courseOfferingRepository.findPublicVisibleById(
                        courseOfferingId,
                        publicSubTermStatusCodes
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
                .and(Sort.by("courseOfferingSubTerms.subTerm.sortOrder").ascending())
                .and(Sort.by("courseVersion.course.subject.code").ascending())
                .and(Sort.by("courseVersion.course.courseNumber").ascending())
                .and(Sort.by("courseVersion.versionNumber").descending())
                .and(Sort.by("id").ascending());
    }
}
