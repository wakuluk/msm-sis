package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.AcademicSubTermResponse;
import com.msm.sis.api.dto.academic.year.*;
import com.msm.sis.api.dto.catalog.AcademicYearCoursesResponse;
import com.msm.sis.api.dto.catalog.AcademicYearCoursesSummaryResponse;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicYearStatus;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.entity.CourseOffering;
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
    private final AcademicSubTermService academicSubTermService;
    private final AcademicTermService academicTermService;
    private final CourseOfferingRepository courseOfferingRepository;
    private final AcademicYearMapper academicYearMapper;
    private final CourseMapper courseMapper;
    private final EntityManager entityManager;

    public AcademicYearService(
            AcademicYearRepository academicYearRepository,
            AcademicYearStatusRepository academicYearStatusRepository,
            AcademicValidationService academicValidationService,
            AcademicSubTermService academicSubTermService,
            AcademicTermService academicTermService,
            CourseOfferingRepository courseOfferingRepository,
            AcademicYearMapper academicYearMapper,
            CourseMapper courseMapper,
            EntityManager entityManager) {
        this.academicYearRepository = academicYearRepository;
        this.academicYearStatusRepository = academicYearStatusRepository;
        this.academicValidationService = academicValidationService;
        this.academicSubTermService = academicSubTermService;
        this.academicTermService = academicTermService;
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
        academicSubTermService.createAcademicSubTerms(
                savedAcademicYear,
                createAcademicYearRequest.subTerms()
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
                academicSubTermService.getAcademicSubTerms(id),
                academicTermService.getAcademicTerms(id)
        );
    }

    public AcademicYear getAcademicYearEntity(Long id){
        return academicYearRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public AcademicYearCoursesSummaryResponse getCoursesSummary(
            Long id
    ){
        AcademicYear academicYear = getAcademicYearEntity(id);
        List<AcademicTermResponse> academicTerms = academicTermService.getAcademicTerms(id);

        List<Long> subTermIds = academicTerms.stream()
                .flatMap(term -> safeSubTerms(term).stream())
                .map(AcademicSubTermResponse::subTermId)
                .toList();

        java.util.Map<Long, Long> courseOfferingCountsBySubTermId = subTermIds.isEmpty()
                ? java.util.Map.of()
                : courseOfferingRepository.countBySubTermIds(subTermIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CourseOfferingRepository.SubTermCourseOfferingCount::getSubTermId,
                        CourseOfferingRepository.SubTermCourseOfferingCount::getCourseOfferingCount
                ));

        List<AcademicYearCoursesSummaryResponse.TermSummary> termSummaries = academicTerms.stream()
                .map(term -> toCoursesTermSummary(term, courseOfferingCountsBySubTermId))
                .toList();

        long subTermCount = termSummaries.stream()
                .mapToLong(AcademicYearCoursesSummaryResponse.TermSummary::subTermCount)
                .sum();

        long courseOfferingCount = termSummaries.stream()
                .mapToLong(AcademicYearCoursesSummaryResponse.TermSummary::courseOfferingCount)
                .sum();

        return new AcademicYearCoursesSummaryResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                termSummaries.size(),
                subTermCount,
                courseOfferingCount,
                termSummaries
        );
    }

    @Transactional(readOnly = true)
    public AcademicYearCoursesResponse getCourses(Long id) {
        AcademicYear academicYear = getAcademicYearEntity(id);
        List<AcademicTermResponse> academicTerms = academicTermService.getAcademicTerms(id);
        Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsBySubTermId =
                getCourseOfferingsBySubTermId(id);

        List<AcademicYearCoursesResponse.TermCoursesResponse> terms = academicTerms.stream()
                .map(term -> toAcademicYearCoursesTermResponse(term, courseOfferingsBySubTermId))
                .toList();

        return new AcademicYearCoursesResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                terms
        );
    }

    @Transactional
    public AcademicYearResponse postAcademicYearSubTerms(
            Long id,
            List<CreateAcademicYearSubTermRequest> createAcademicSubTermRequestList,
            String updatedBy
    ){
        AcademicYear academicYear = getAcademicYearEntity(id);
        academicSubTermService.createAcademicSubTerms(
                academicYear,
                createAcademicSubTermRequestList
        );
        return getAcademicYear(id);
    }

    @Transactional
    public AcademicTermResponse postAcademicYearTerm(
            Long academicYearId,
            CreateAcademicTermRequest request
    ) {
        getAcademicYearEntity(academicYearId);
        return academicTermService.createAcademicTerm(academicYearId, request);
    }

    @Transactional(readOnly = true)
    public List<AcademicTermResponse> getAcademicYearTerms(
            Long academicYearId
    ) {
        getAcademicYearEntity(academicYearId);
        return academicTermService.getAcademicTerms(academicYearId);
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

    private AcademicYearCoursesResponse.TermCoursesResponse toAcademicYearCoursesTermResponse(
            AcademicTermResponse term,
            Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsBySubTermId
    ) {
        List<AcademicYearCoursesResponse.SubTermCoursesResponse> subTerms = safeSubTerms(term).stream()
                .map(subTerm -> toAcademicYearCoursesSubTermResponse(subTerm, courseOfferingsBySubTermId))
                .toList();

        return new AcademicYearCoursesResponse.TermCoursesResponse(
                term.getTermId(),
                term.getCode(),
                term.getName(),
                term.getStartDate(),
                term.getEndDate(),
                subTerms
        );
    }

    private AcademicYearCoursesResponse.SubTermCoursesResponse toAcademicYearCoursesSubTermResponse(
            AcademicSubTermResponse subTerm,
            Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsBySubTermId
    ) {
        List<CourseOfferingSearchResultResponse> courseOfferings =
                courseOfferingsBySubTermId.getOrDefault(subTerm.subTermId(), List.of());

        return new AcademicYearCoursesResponse.SubTermCoursesResponse(
                subTerm.subTermId(),
                subTerm.code(),
                subTerm.name(),
                subTerm.startDate(),
                subTerm.endDate(),
                courseOfferings.size(),
                courseOfferings
        );
    }

    private Map<Long, List<CourseOfferingSearchResultResponse>> getCourseOfferingsBySubTermId(
            Long academicYearId
    ) {
        List<CourseOffering> courseOfferings = courseOfferingRepository.findAllByAcademicYear_Id(
                academicYearId,
                buildCatalogOfferingSort()
        );

        Map<Long, List<CourseOfferingSearchResultResponse>> courseOfferingsBySubTermId =
                new LinkedHashMap<>();

        for (CourseOffering courseOffering : courseOfferings) {
            courseOffering.getCourseOfferingSubTerms().stream()
                    .map(CourseOfferingSubTerm::getSubTerm)
                    .filter(Objects::nonNull)
                    .filter(term -> Objects.equals(term.getAcademicYear().getId(), academicYearId))
                    .sorted(
                            Comparator.comparing(
                                            AcademicSubTerm::getSortOrder,
                                            Comparator.nullsLast(Integer::compareTo)
                                    )
                    .thenComparing(
                                            AcademicSubTerm::getCode,
                                            Comparator.nullsLast(String::compareTo)
                                    )
                    )
                    .forEach(subTerm -> courseOfferingsBySubTermId
                            .computeIfAbsent(subTerm.getId(), ignored -> new java.util.ArrayList<>())
                            .add(courseMapper.toCourseOfferingSearchResultResponse(courseOffering, subTerm)));
        }

        return courseOfferingsBySubTermId;
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

    private AcademicYearCoursesSummaryResponse.TermSummary toCoursesTermSummary(
            AcademicTermResponse academicTerm,
            java.util.Map<Long, Long> courseOfferingCountsBySubTermId
    ) {
        List<AcademicYearCoursesSummaryResponse.SubTermSummary> subTermSummaries = safeSubTerms(academicTerm).stream()
                .map(subTerm -> toCoursesSubTermSummary(subTerm, courseOfferingCountsBySubTermId))
                .toList();

        long courseOfferingCount = subTermSummaries.stream()
                .mapToLong(AcademicYearCoursesSummaryResponse.SubTermSummary::courseOfferingCount)
                .sum();

        return new AcademicYearCoursesSummaryResponse.TermSummary(
                academicTerm.getTermId(),
                academicTerm.getCode(),
                academicTerm.getName(),
                subTermSummaries.size(),
                courseOfferingCount,
                subTermSummaries
        );
    }

    private AcademicYearCoursesSummaryResponse.SubTermSummary toCoursesSubTermSummary(
            AcademicSubTermResponse academicSubTerm,
            java.util.Map<Long, Long> courseOfferingCountsBySubTermId
    ) {
        return new AcademicYearCoursesSummaryResponse.SubTermSummary(
                academicSubTerm.subTermId(),
                academicSubTerm.code(),
                academicSubTerm.name(),
                courseOfferingCountsBySubTermId.getOrDefault(academicSubTerm.subTermId(), 0L)
        );
    }

    private List<AcademicSubTermResponse> safeSubTerms(AcademicTermResponse academicTerm) {
        return academicTerm.getSubTerms() == null ? List.of() : academicTerm.getSubTerms();
    }
}
