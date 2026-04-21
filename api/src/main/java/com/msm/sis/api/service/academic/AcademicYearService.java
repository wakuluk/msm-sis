package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicTermGroupResponse;
import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.year.*;
import com.msm.sis.api.dto.catalog.AcademicYearCatalogResponse;
import com.msm.sis.api.dto.catalog.AcademicYearCatalogSummaryResponse;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicYearStatus;
import com.msm.sis.api.entity.CourseOfferingTerm;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.CourseOfferingRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.AcademicYearStatusRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicYearService {
    private static final String DRAFT_ACADEMIC_YEAR_STATUS_CODE = "DRAFT";

    private final AcademicYearRepository academicYearRepository;
    private final AcademicYearStatusRepository academicYearStatusRepository;
    private final AcademicValidationService academicValidationService;
    private final AcademicTermService academicTermService;
    private final AcademicTermGroupService academicTermGroupService;
    private final AcademicTermRepository academicTermRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final AcademicYearMapper academicYearMapper;
    private final CourseMapper courseMapper;
    private final EntityManager entityManager;

    public AcademicYearService(
            AcademicYearRepository academicYearRepository,
            AcademicYearStatusRepository academicYearStatusRepository,
            AcademicValidationService academicValidationService,
            AcademicTermService academicTermService,
            AcademicTermGroupService academicTermGroupService,
            AcademicTermRepository academicTermRepository,
            CourseOfferingRepository courseOfferingRepository,
            AcademicYearMapper academicYearMapper,
            CourseMapper courseMapper,
            EntityManager entityManager) {
        this.academicYearRepository = academicYearRepository;
        this.academicYearStatusRepository = academicYearStatusRepository;
        this.academicTermRepository = academicTermRepository;
        this.academicValidationService = academicValidationService;
        this.academicTermService = academicTermService;
        this.academicTermGroupService = academicTermGroupService;
        this.courseOfferingRepository = courseOfferingRepository;
        this.academicYearMapper = academicYearMapper;
        this.courseMapper = courseMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public AcademicYearResponse createAcademicYear(CreateAcademicYearRequest createAcademicYearRequest){
        AcademicYear academicYear = academicYearMapper.fromCreateAcademicYearRequest(createAcademicYearRequest);
        academicYear.setStatus(getDraftAcademicYearStatus());
        academicValidationService.validateCreateAcademicYear(academicYear);

        AcademicYear savedAcademicYear = academicYearRepository.save(academicYear);
        academicTermService.createAcademicTerms(
                savedAcademicYear,
                createAcademicYearRequest.terms()
        );
        entityManager.flush();
        entityManager.clear();
        return getAcademicYear(savedAcademicYear.getId());
    }


    @Transactional
    public AcademicYearResponse patchAcademicYear(
            Long id,
            PatchAcademicYearRequest patchAcademicYearRequest,
            String updatedBy
    ){
        AcademicYear existingAcademicYear = getAcademicYearEntity(id);
        AcademicYear candidateAcademicYear = academicYearMapper.copy(existingAcademicYear);

        academicYearMapper.applyPatch(candidateAcademicYear, patchAcademicYearRequest);
        academicValidationService.validatePatchAcademicYear(existingAcademicYear, candidateAcademicYear);

        if (!hasPatchableChanges(existingAcademicYear, candidateAcademicYear)) {
            return getAcademicYear(id);
        }

        academicYearMapper.copyPatchableFields(candidateAcademicYear, existingAcademicYear);
        existingAcademicYear.setUpdatedBy(updatedBy);
        academicYearRepository.save(existingAcademicYear);
        entityManager.flush();
        entityManager.clear();
        return getAcademicYear(id);
    }

    @Transactional
    public AcademicYearResponse shiftAcademicYearStatus(
            Long id,
            AcademicYearStatusShiftDirection direction,
            String updatedBy
    ) {
        if (direction == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status shift direction is required."
            );
        }

        AcademicYear academicYear = getAcademicYearEntity(id);
        AcademicYearStatus currentStatus = academicYear.getStatus();

        if (currentStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year does not have a current status."
            );
        }

        if (!currentStatus.isActive() || !currentStatus.isAllowLinearShift()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current academic year status cannot be shifted linearly."
            );
        }

        List<AcademicYearStatus> linearStatuses = academicYearStatusRepository
                .findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();

        int currentIndex = findAcademicYearStatusIndex(linearStatuses, currentStatus.getId());

        if (currentIndex < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current academic year status is not part of the linear status flow."
            );
        }

        int targetIndex = direction == AcademicYearStatusShiftDirection.UP
                ? currentIndex + 1
                : currentIndex - 1;

        if (targetIndex < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year is already at the first workflow step."
            );
        }

        if (targetIndex >= linearStatuses.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year is already at the final workflow step."
            );
        }

        academicYear.setStatus(linearStatuses.get(targetIndex));
        academicYear.setUpdatedBy(updatedBy);
        academicYearRepository.save(academicYear);
        entityManager.flush();
        entityManager.clear();
        return getAcademicYear(id);
    }



    @Transactional(readOnly = true)
    public AcademicYearResponse getAcademicYear(Long id){
        AcademicYear academicYear = getAcademicYearEntity(id);
        return academicYearMapper.toAcademicYearResponse(
                academicYear,
                academicTermGroupService.getAcademicTermGroups(id)
        );
    }

    public AcademicYear getAcademicYearEntity(Long id){
        return academicYearRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public AcademicYearCatalogSummaryResponse getCatalogSummary(
            Long id
    ){
        AcademicYear academicYear = getAcademicYearEntity(id);
        List<AcademicTermGroupResponse> academicTermGroups = academicTermGroupService.getAcademicTermGroups(id);

        List<Long> termIds = academicTermGroups.stream()
                .flatMap(termGroup -> safeAcademicTerms(termGroup).stream())
                .map(AcademicTermResponse::termId)
                .toList();

        java.util.Map<Long, Long> courseOfferingCountsByTermId = termIds.isEmpty()
                ? java.util.Map.of()
                : courseOfferingRepository.countByTermIds(termIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CourseOfferingRepository.TermCourseOfferingCount::getTermId,
                        CourseOfferingRepository.TermCourseOfferingCount::getCourseOfferingCount
                ));

        List<AcademicYearCatalogSummaryResponse.TermGroupSummary> termGroupSummaries = academicTermGroups.stream()
                .map(termGroup -> toCatalogTermGroupSummary(termGroup, courseOfferingCountsByTermId))
                .toList();

        long termCount = termGroupSummaries.stream()
                .mapToLong(AcademicYearCatalogSummaryResponse.TermGroupSummary::termCount)
                .sum();

        long courseOfferingCount = termGroupSummaries.stream()
                .mapToLong(AcademicYearCatalogSummaryResponse.TermGroupSummary::courseOfferingCount)
                .sum();

        return new AcademicYearCatalogSummaryResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                termGroupSummaries.size(),
                termCount,
                courseOfferingCount,
                termGroupSummaries
        );
    }

    @Transactional(readOnly = true)
    public AcademicYearCatalogResponse getCatalog(Long id) {
        AcademicYear academicYear = getAcademicYearEntity(id);
        List<AcademicTermGroupResponse> academicTermGroups = academicTermGroupService.getAcademicTermGroups(id);
        Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsByTermId =
                getCourseOfferingsByTermId(id);

        List<AcademicYearCatalogResponse.TermGroupCatalogResponse> termGroups = academicTermGroups.stream()
                .map(termGroup -> toAcademicYearCatalogTermGroupResponse(termGroup, courseOfferingsByTermId))
                .toList();

        return new AcademicYearCatalogResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                termGroups
        );
    }

    @Transactional
    public AcademicYearResponse postAcademicYearTerm(
            Long id,
            List<CreateAcademicYearTermRequest> createAcademicTermRequestList,
            String updatedBy
    ){
        AcademicYear academicYear = getAcademicYearEntity(id);
        academicTermService.createAcademicTerms(
                academicYear,
                createAcademicTermRequestList
        );
        return getAcademicYear(id);
    }

    @Transactional
    public com.msm.sis.api.dto.academic.term.AcademicTermGroupResponse postAcademicYearTermGroup(
            Long academicYearId,
            com.msm.sis.api.dto.academic.term.CreateAcademicTermGroupRequest request
    ) {
        getAcademicYearEntity(academicYearId);
        return academicTermGroupService.createAcademicTermGroup(academicYearId, request);
    }

    @Transactional(readOnly = true)
    public List<com.msm.sis.api.dto.academic.term.AcademicTermGroupResponse> getAcademicYearTermGroups(
            Long academicYearId
    ) {
        getAcademicYearEntity(academicYearId);
        return academicTermGroupService.getAcademicTermGroups(academicYearId);
    }

    public List<AcademicYearSearchResponse> searchAcademicYears(AcademicYearSearchCriteria criteria){
        int page = criteria.getPage() == null ? 0 : criteria.getPage();
        int size = criteria.getSize() == null ? 25 : criteria.getSize();

        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                buildSearchSort(criteria)
        );

        Page<AcademicYear> academicYearsPage = academicYearRepository.findAll(
                buildSearchSpecification(criteria),
                pageable
        );

        return academicYearsPage.getContent().stream()
                .map(academicYearMapper::toAcademicYearSearchResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AcademicYearStatusResponse> getAcademicYearStatuses() {
        return academicYearStatusRepository.findAllByOrderBySortOrderAsc().stream()
                .map(status -> new AcademicYearStatusResponse(
                        status.getCode(),
                        status.getName(),
                        status.getSortOrder()
                ))
                .toList();
    }

    private Specification<AcademicYear> buildSearchSpecification(AcademicYearSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new java.util.ArrayList<>();

            String normalizedQuery = trimToNull(criteria.getQuery());
            if (normalizedQuery != null) {
                String likeValue = "%" + normalizedQuery.toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("code")), likeValue),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), likeValue)
                ));
            }

            String normalizedYearStatusCode = trimToNull(criteria.getYearStatusCode());
            if (normalizedYearStatusCode != null) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.upper(root.join("status").get("code")),
                        normalizedYearStatusCode.toUpperCase(Locale.ROOT)
                ));
            }

            if (Boolean.TRUE.equals(criteria.getCurrentOnly())) {
                LocalDate today = LocalDate.now();
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), today));
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("endDate"), today));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private AcademicYearCatalogResponse.TermGroupCatalogResponse toAcademicYearCatalogTermGroupResponse(
            AcademicTermGroupResponse termGroup,
            Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsByTermId
    ) {
        List<AcademicYearCatalogResponse.TermCatalogResponse> terms = safeAcademicTerms(termGroup).stream()
                .map(term -> toAcademicYearCatalogTermResponse(term, courseOfferingsByTermId))
                .toList();

        return new AcademicYearCatalogResponse.TermGroupCatalogResponse(
                termGroup.getTermGroupId(),
                termGroup.getCode(),
                termGroup.getName(),
                termGroup.getStartDate(),
                termGroup.getEndDate(),
                terms
        );
    }

    private AcademicYearCatalogResponse.TermCatalogResponse toAcademicYearCatalogTermResponse(
            AcademicTermResponse term,
            Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsByTermId
    ) {
        List<CourseOfferingSearchResultResponse> courseOfferings =
                courseOfferingsByTermId.getOrDefault(term.termId(), List.of());

        return new AcademicYearCatalogResponse.TermCatalogResponse(
                term.termId(),
                term.code(),
                term.name(),
                term.startDate(),
                term.endDate(),
                courseOfferings.size(),
                courseOfferings
        );
    }

    private Map<Long, List<CourseOfferingSearchResultResponse>> getCourseOfferingsByTermId(
            Long academicYearId
    ) {
        List<CourseOffering> courseOfferings = courseOfferingRepository.findAllByAcademicYear_Id(
                academicYearId,
                buildCatalogOfferingSort()
        );

        Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsByTermId =
                new LinkedHashMap<>();

        for (CourseOffering courseOffering : courseOfferings) {
            courseOffering.getCourseOfferingTerms().stream()
                    .map(CourseOfferingTerm::getTerm)
                    .filter(Objects::nonNull)
                    .filter(term -> Objects.equals(term.getAcademicYear().getId(), academicYearId))
                    .sorted(
                            Comparator.comparing(
                                            AcademicTerm::getSortOrder,
                                            Comparator.nullsLast(Integer::compareTo)
                                    )
                                    .thenComparing(
                                            AcademicTerm::getCode,
                                            Comparator.nullsLast(String::compareTo)
                                    )
                    )
                    .forEach(term -> courseOfferingsByTermId
                            .computeIfAbsent(term.getId(), ignored -> new java.util.ArrayList<>())
                            .add(courseMapper.toCourseOfferingSearchResultResponse(courseOffering, term)));
        }

        return courseOfferingsByTermId;
    }

    private Sort buildCatalogOfferingSort() {
        return Sort.by("courseVersion.course.subject.code").ascending()
                .and(Sort.by("courseVersion.course.courseNumber").ascending())
                .and(Sort.by("courseVersion.versionNumber").descending())
                .and(Sort.by("status.sortOrder").ascending())
                .and(Sort.by("id").ascending());
    }

    private Sort buildSearchSort(AcademicYearSearchCriteria criteria) {
        String sortBy = trimToNull(criteria.getSortBy());
        Sort.Direction sortDirection = parseSortDirection(criteria.getSortDirection());

        String sortProperty = switch (sortBy == null ? "startDate" : sortBy) {
            case "code" -> "code";
            case "name" -> "name";
            case "startDate" -> "startDate";
            case "endDate" -> "endDate";
            case "yearStatus", "status", "yearStatusCode" -> "status.sortOrder";
            case "isPublished", "published" -> "isPublished";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: code, name, startDate, endDate, yearStatus, isPublished."
            );
        };

        return Sort.by(sortDirection, sortProperty)
                .and(Sort.by(Sort.Direction.DESC, "startDate"))
                .and(Sort.by(Sort.Direction.ASC, "code"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        if (trimToNull(sortDirection) == null) {
            return Sort.Direction.DESC;
        }

        try {
            return Sort.Direction.fromString(sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

    private boolean hasPatchableChanges(
            AcademicYear existingAcademicYear,
            AcademicYear candidateAcademicYear
    ) {
        return !Objects.equals(existingAcademicYear.getCode(), candidateAcademicYear.getCode())
                || !Objects.equals(existingAcademicYear.getName(), candidateAcademicYear.getName())
                || !Objects.equals(existingAcademicYear.getStartDate(), candidateAcademicYear.getStartDate())
                || !Objects.equals(existingAcademicYear.getEndDate(), candidateAcademicYear.getEndDate());
    }

    private int findAcademicYearStatusIndex(List<AcademicYearStatus> statuses, Long statusId) {
        for (int index = 0; index < statuses.size(); index += 1) {
            if (Objects.equals(statuses.get(index).getId(), statusId)) {
                return index;
            }
        }

        return -1;
    }

    private AcademicYearStatus getDraftAcademicYearStatus() {
        return academicYearStatusRepository.findByCode(trimToNull(DRAFT_ACADEMIC_YEAR_STATUS_CODE))
                .filter(AcademicYearStatus::isActive)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic year status 'DRAFT' must exist and be active."
                ));
    }

    private AcademicYearCatalogSummaryResponse.TermGroupSummary toCatalogTermGroupSummary(
            AcademicTermGroupResponse academicTermGroup,
            java.util.Map<Long, Long> courseOfferingCountsByTermId
    ) {
        List<AcademicYearCatalogSummaryResponse.TermSummary> termSummaries = safeAcademicTerms(academicTermGroup).stream()
                .map(term -> toCatalogTermSummary(term, courseOfferingCountsByTermId))
                .toList();

        long courseOfferingCount = termSummaries.stream()
                .mapToLong(AcademicYearCatalogSummaryResponse.TermSummary::courseOfferingCount)
                .sum();

        return new AcademicYearCatalogSummaryResponse.TermGroupSummary(
                academicTermGroup.getTermGroupId(),
                academicTermGroup.getCode(),
                academicTermGroup.getName(),
                termSummaries.size(),
                courseOfferingCount,
                termSummaries
        );
    }

    private AcademicYearCatalogSummaryResponse.TermSummary toCatalogTermSummary(
            AcademicTermResponse academicTerm,
            java.util.Map<Long, Long> courseOfferingCountsByTermId
    ) {
        return new AcademicYearCatalogSummaryResponse.TermSummary(
                academicTerm.termId(),
                academicTerm.code(),
                academicTerm.name(),
                courseOfferingCountsByTermId.getOrDefault(academicTerm.termId(), 0L)
        );
    }

    private List<AcademicTermResponse> safeAcademicTerms(AcademicTermGroupResponse academicTermGroup) {
        return academicTermGroup.getAcademicTerms() == null ? List.of() : academicTermGroup.getAcademicTerms();
    }
}
