package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.year.*;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.patch.PatchValue;
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
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicYearService {

    private final AcademicYearRepository academicYearRepository;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicValidationService academicValidationService;
    private final AcademicTermService academicTermService;
    private final AcademicYearMapper academicYearMapper;
    private final EntityManager entityManager;

    public AcademicYearService(
            AcademicYearRepository academicYearRepository,
            AcademicTermRepository academicTermRepository,
            AcademicValidationService academicValidationService,
            AcademicTermService academicTermService,
            AcademicYearMapper academicYearMapper,
            EntityManager entityManager
    ) {
        this.academicYearRepository = academicYearRepository;
        this.academicTermRepository = academicTermRepository;
        this.academicValidationService = academicValidationService;
        this.academicTermService = academicTermService;
        this.academicYearMapper = academicYearMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public AcademicYearResponse createAcademicYear(CreateAcademicYearRequest createAcademicYearRequest){
        AcademicYear academicYear = academicYearMapper.fromCreateAcademicYearRequest(createAcademicYearRequest);
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
        AcademicYear academicYear = getAcademicYearEntity(id);
        List<AcademicTerm> academicTerms = academicTermRepository.findAllByAcademicYear_IdOrderBySortOrderAsc(id);

        academicYearMapper.applyPatch(academicYear, patchAcademicYearRequest);
        applyAcademicTermPatches(academicYear, academicTerms, patchAcademicYearRequest.getPatchAcademicTermRequest(), updatedBy);

        academicValidationService.validatePatchAcademicYear(academicYear);
        academicValidationService.validatePatchedAcademicTerms(academicYear, academicTerms);

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
                academicTermRepository.findAllByAcademicYear_IdOrderBySortOrderAsc(id)
        );
    }

    public AcademicYear getAcademicYearEntity(Long id){
        return academicYearRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private void applyAcademicTermPatches(
            AcademicYear academicYear,
            List<AcademicTerm> academicTerms,
            PatchValue<List<PatchAcademicYearTermRequest>> patchAcademicTermRequests,
            String updatedBy
    ) {
        if (!patchAcademicTermRequests.isPresent()) {
            return;
        }

        List<PatchAcademicYearTermRequest> requestedTermPatches = patchAcademicTermRequests.orElse(List.of());
        if (requestedTermPatches == null || requestedTermPatches.isEmpty()) {
            return;
        }

        Map<Long, AcademicTerm> academicTermsById = academicTerms.stream()
                .collect(Collectors.toMap(AcademicTerm::getId, Function.identity()));
        Set<Long> seenTermIds = new HashSet<>();

        for (PatchAcademicYearTermRequest requestedTermPatch : requestedTermPatches) {
            Long termId = requestedTermPatch.getTermId();
            if (termId == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term ID is required when patching academic terms."
                );
            }

            if (!seenTermIds.add(termId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term patch list contains duplicate term IDs."
                );
            }

            AcademicTerm academicTerm = academicTermsById.get(termId);
            if (academicTerm == null || !academicYear.getId().equals(academicTerm.getAcademicYear().getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term does not belong to the target academic year."
                );
            }

            academicYearMapper.applyPatch(academicTerm, requestedTermPatch);
            academicTerm.setUpdatedBy(updatedBy);
        }
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

            if (criteria.getActive() != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), criteria.getActive()));
            }

            if (Boolean.TRUE.equals(criteria.getCurrentOnly())) {
                LocalDate today = LocalDate.now();
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), today));
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("endDate"), today));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Sort buildSearchSort(AcademicYearSearchCriteria criteria) {
        String sortBy = trimToNull(criteria.getSortBy());
        Sort.Direction sortDirection = parseSortDirection(criteria.getSortDirection());

        String sortProperty = switch (sortBy == null ? "startDate" : sortBy) {
            case "code" -> "code";
            case "name" -> "name";
            case "startDate" -> "startDate";
            case "endDate" -> "endDate";
            case "active" -> "active";
            case "isPublished", "published" -> "isPublished";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: code, name, startDate, endDate, active, isPublished."
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
}
