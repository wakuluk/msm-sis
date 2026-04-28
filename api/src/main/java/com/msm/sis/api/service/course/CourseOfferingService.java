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
import com.msm.sis.api.repository.CourseVersionRepository;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;

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
    private final CourseVersionRepository courseVersionRepository;
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
            CourseVersionRepository courseVersionRepository,
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
        this.courseVersionRepository = courseVersionRepository;
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
        if (academicYearId == null || academicYearId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year id must be a positive number."
            );
        }

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Create course offering request is required."
            );
        }

        Long courseId = request.courseId();
        if (courseId == null || courseId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course id must be a positive number."
            );
        }

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
        CourseVersion currentCourseVersion = getCurrentCourseVersion(courseId);

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
        if (academicYearId == null || academicYearId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year id must be a positive number."
            );
        }

        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<CourseVersion> eligibleCurrentCourseVersions = courseVersionRepository.findCurrentCourseVersions().stream()
                .filter(courseVersion -> courseVersion.getCourse() != null && courseVersion.getCourse().isActive())
                .toList();

        List<CourseOffering> courseOfferingsToCreate = eligibleCurrentCourseVersions.stream()
                .filter(courseVersion -> !courseOfferingRepository.existsByCourseIdAndAcademicYearId(
                        courseVersion.getCourse().getId(),
                        academicYearId
                ))
                .map(courseVersion -> buildCourseOffering(academicYear, courseVersion))
                .toList();

        courseOfferingRepository.saveAll(courseOfferingsToCreate);
        courseOfferingRepository.flush();

        return new ImportAcademicYearCourseOfferingsResponse(
                academicYearId,
                eligibleCurrentCourseVersions.size(),
                courseOfferingsToCreate.size(),
                eligibleCurrentCourseVersions.size() - courseOfferingsToCreate.size()
        );
    }

    @Transactional
    public SyncAcademicYearCourseOfferingsResponse syncAcademicYearCourseOfferingsToCurrentCourseVersions(
            Long academicYearId
    ) {
        if (academicYearId == null || academicYearId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year id must be a positive number."
            );
        }

        academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<CourseOffering> courseOfferings = courseOfferingRepository.findAllByAcademicYear_Id(
                academicYearId,
                Sort.by(Sort.Direction.ASC, "id")
        );
        List<Long> courseIds = courseOfferings.stream()
                .map(CourseOffering::getCourseVersion)
                .filter(Objects::nonNull)
                .map(CourseVersion::getCourse)
                .filter(Objects::nonNull)
                .map(com.msm.sis.api.entity.Course::getId)
                .distinct()
                .toList();

        Map<Long, CourseVersion> currentCourseVersionsByCourseId = courseIds.isEmpty()
                ? Map.of()
                : courseVersionRepository.findCurrentCourseVersionsByCourseIds(courseIds)
                        .stream()
                        .filter(courseVersion -> courseVersion.getCourse() != null)
                        .collect(java.util.stream.Collectors.toMap(
                                courseVersion -> courseVersion.getCourse().getId(),
                                courseVersion -> courseVersion,
                                (left, right) -> left,
                                LinkedHashMap::new
                        ));

        Set<Long> courseIdsWithCurrentOffering = courseOfferings.stream()
                .map(courseOffering -> {
                    CourseVersion courseVersion = courseOffering.getCourseVersion();
                    if (courseVersion == null || courseVersion.getCourse() == null) {
                        return null;
                    }

                    CourseVersion currentCourseVersion = currentCourseVersionsByCourseId.get(
                            courseVersion.getCourse().getId()
                    );

                    if (currentCourseVersion == null) {
                        return null;
                    }

                    return Objects.equals(courseVersion.getId(), currentCourseVersion.getId())
                            ? courseVersion.getCourse().getId()
                            : null;
                })
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        int updatedCourseOfferingCount = 0;
        int alreadyCurrentCourseOfferingCount = 0;
        int skippedMissingCurrentCourseVersionCount = 0;
        int skippedDuplicateCurrentOfferingCount = 0;
        List<CourseOffering> courseOfferingsToUpdate = new java.util.ArrayList<>();

        for (CourseOffering courseOffering : courseOfferings) {
            CourseVersion existingCourseVersion = courseOffering.getCourseVersion();
            Long courseId = existingCourseVersion == null || existingCourseVersion.getCourse() == null
                    ? null
                    : existingCourseVersion.getCourse().getId();

            if (courseId == null) {
                skippedMissingCurrentCourseVersionCount++;
                continue;
            }

            CourseVersion currentCourseVersion = currentCourseVersionsByCourseId.get(courseId);
            if (currentCourseVersion == null) {
                skippedMissingCurrentCourseVersionCount++;
                continue;
            }

            if (Objects.equals(existingCourseVersion.getId(), currentCourseVersion.getId())) {
                alreadyCurrentCourseOfferingCount++;
                continue;
            }

            if (courseIdsWithCurrentOffering.contains(courseId)) {
                skippedDuplicateCurrentOfferingCount++;
                continue;
            }

            courseOffering.setCourseVersion(currentCourseVersion);
            courseIdsWithCurrentOffering.add(courseId);
            courseOfferingsToUpdate.add(courseOffering);
            updatedCourseOfferingCount++;
        }

        if (updatedCourseOfferingCount > 0) {
            courseOfferingRepository.saveAll(courseOfferingsToUpdate);
            courseOfferingRepository.flush();
            entityManager.clear();
        }

        return new SyncAcademicYearCourseOfferingsResponse(
                academicYearId,
                courseOfferings.size(),
                updatedCourseOfferingCount,
                alreadyCurrentCourseOfferingCount,
                skippedMissingCurrentCourseVersionCount,
                skippedDuplicateCurrentOfferingCount
        );
    }

    @Transactional
    public CourseOfferingDetailResponse patchCourseOffering(
            Long courseOfferingId,
            PatchCourseOfferingRequest request
    ) {
        if (courseOfferingId == null || courseOfferingId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course offering id must be a positive number."
            );
        }

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Patch course offering request is required."
            );
        }

        if (request.getCourseOfferingId() != null
                && !Objects.equals(request.getCourseOfferingId(), courseOfferingId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course offering id in the request does not match the target course offering."
            );
        }

        CourseOffering courseOffering = courseOfferingRepository.findById(courseOfferingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Long academicYearId = courseOffering.getAcademicYear() == null
                ? null
                : courseOffering.getAcademicYear().getId();
        if (academicYearId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        boolean subTermsChanged = false;
        if (request.getSubTermIds().isPresent()) {
            List<Long> requestedSubTermIds = courseOfferingSubTermService.normalizeSubTermIds(request.getSubTermIds().getValue());
            if (requestedSubTermIds.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "At least one academic sub term is required."
                );
            }

            List<AcademicSubTerm> academicSubTerms = courseOfferingSubTermService.getAcademicSubTermsForAcademicYear(
                    academicYearId,
                    requestedSubTermIds
            );
            List<Long> existingSubTermIds = courseOffering.getCourseOfferingSubTerms().stream()
                    .map(CourseOfferingSubTerm::getSubTerm)
                    .filter(Objects::nonNull)
                    .map(AcademicSubTerm::getId)
                    .sorted()
                    .toList();
            List<Long> normalizedRequestedSubTermIds = academicSubTerms.stream()
                    .map(AcademicSubTerm::getId)
                    .sorted()
                    .toList();

            if (!Objects.equals(existingSubTermIds, normalizedRequestedSubTermIds)) {
                courseOfferingSubTermRepository.deleteAllByCourseOffering_Id(courseOfferingId);
                entityManager.flush();

                List<CourseOfferingSubTerm> courseOfferingSubTerms = academicSubTerms.stream()
                        .map(academicSubTerm -> courseOfferingSubTermService.buildCourseOfferingSubTerm(
                                courseOffering,
                                courseOffering.getAcademicYear(),
                                academicSubTerm
                        ))
                        .toList();
                courseOfferingSubTermRepository.saveAll(courseOfferingSubTerms);
                subTermsChanged = true;
            }
        }

        boolean changed = subTermsChanged;

        if (request.getNotes().isPresent()) {
            String notes = trimToNull(request.getNotes().getValue());
            if (!Objects.equals(courseOffering.getNotes(), notes)) {
                courseOffering.setNotes(notes);
                changed = true;
            }
        }

        if (!changed) {
            return getCourseOfferingById(courseOfferingId);
        }

        courseOfferingRepository.save(courseOffering);
        entityManager.flush();
        entityManager.clear();
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
        if (academicYearId == null || academicYearId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year id must be a positive number."
            );
        }

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

    private CourseVersion getCurrentCourseVersion(Long courseId) {
        return courseVersionRepository.findCurrentCourseVersionsByCourseId(courseId).stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course must have a current version before it can be added to the catalog."
                ));
    }

    private CourseOffering buildCourseOffering(
            AcademicYear academicYear,
            CourseVersion courseVersion
    ) {
        CourseOffering courseOffering = new CourseOffering();
        courseOffering.setAcademicYear(academicYear);
        courseOffering.setCourseVersion(courseVersion);
        courseOffering.setNotes(null);
        return courseOffering;
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
