package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermRequest;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.mapper.AcademicTermMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.CourseOfferingRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class AcademicTermService {

    private final AcademicTermRepository academicTermRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AcademicSubTermRepository academicSubTermRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final AcademicValidationService academicValidationService;
    private final AcademicTermMapper academicTermMapper;
    private final EntityManager entityManager;

    public AcademicTermService(
            AcademicTermRepository academicTermRepository,
            AcademicYearRepository academicYearRepository,
            AcademicSubTermRepository academicSubTermRepository,
            CourseOfferingRepository courseOfferingRepository,
            AcademicValidationService academicValidationService,
            AcademicTermMapper academicTermMapper,
            EntityManager entityManager
    ) {
        this.academicTermRepository = academicTermRepository;
        this.academicYearRepository = academicYearRepository;
        this.academicSubTermRepository = academicSubTermRepository;
        this.courseOfferingRepository = courseOfferingRepository;
        this.academicValidationService = academicValidationService;
        this.academicTermMapper = academicTermMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public AcademicTermResponse createAcademicTerm(
            Long academicYearId,
            CreateAcademicTermRequest request
    ) {
        AcademicYear academicYear = getAcademicYearEntity(academicYearId);
        List<Long> subTermIds = normalizeSubTermIds(request.subTermIds());
        List<AcademicSubTerm> academicSubTerms = getAcademicSubTerms(subTermIds);
        AcademicTerm academicTerm = academicTermMapper.fromCreateAcademicTermRequest(
                academicYear,
                request
        );
        academicValidationService.validateCreateAcademicTerm(
                academicYear,
                academicTerm,
                subTermIds,
                academicSubTerms
        );
        academicTerm.getAcademicSubTerms().addAll(academicSubTerms);
        AcademicTerm savedAcademicTerm = academicTermRepository.save(academicTerm);
        entityManager.flush();
        entityManager.clear();
        return getAcademicTerm(savedAcademicTerm.getId());
    }

    @Transactional(readOnly = true)
    public List<AcademicTermResponse> getAcademicTerms(Long academicYearId) {
        getAcademicYearEntity(academicYearId);
        List<AcademicTerm> academicTerms =
                academicTermRepository.findAllByAcademicYear_IdOrderByStartDateAsc(academicYearId);
        Map<Long, Long> courseOfferingCountsBySubTermId = getCourseOfferingCountsBySubTermId(academicTerms);

        return academicTerms.stream()
                .map(term -> academicTermMapper.toAcademicTermResponse(term, courseOfferingCountsBySubTermId))
                .toList();
    }

    @Transactional(readOnly = true)
    public AcademicTermResponse getAcademicTerm(Long termId) {
        AcademicTerm academicTerm = getAcademicTermEntity(termId);
        return academicTermMapper.toAcademicTermResponse(
                academicTerm,
                getCourseOfferingCountsBySubTermId(List.of(academicTerm))
        );
    }

    @Transactional
    public AcademicTermResponse patchAcademicTerm(
            Long termId,
            PatchAcademicTermRequest request
    ) {
        AcademicTerm existingAcademicTerm = getAcademicTermEntity(termId);
        AcademicTerm candidateAcademicTerm = academicTermMapper.copy(existingAcademicTerm);

        if (request.getTermId() != null && !Objects.equals(request.getTermId(), termId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term ID in the request does not match the target academic term."
            );
        }

        academicTermMapper.applyPatch(candidateAcademicTerm, request);

        List<Long> requestedSubTermIds = request.getSubTermIds().isPresent()
                ? normalizeSubTermIds(request.getSubTermIds().orElse(List.of()))
                : extractAcademicSubTermIds(existingAcademicTerm.getAcademicSubTerms());

        List<AcademicSubTerm> requestedAcademicSubTerms = request.getSubTermIds().isPresent()
                ? getAcademicSubTerms(requestedSubTermIds)
                : List.copyOf(existingAcademicTerm.getAcademicSubTerms());

        academicValidationService.validatePatchAcademicTerm(
                existingAcademicTerm,
                candidateAcademicTerm,
                requestedSubTermIds,
                requestedAcademicSubTerms
        );

        if (!hasPatchableChanges(existingAcademicTerm, candidateAcademicTerm, requestedAcademicSubTerms)) {
            return getAcademicTerm(termId);
        }

        academicTermMapper.copyPatchableFields(candidateAcademicTerm, existingAcademicTerm);
        replaceAcademicSubTerms(existingAcademicTerm, requestedAcademicSubTerms);
        academicTermRepository.save(existingAcademicTerm);
        entityManager.flush();
        entityManager.clear();
        return getAcademicTerm(termId);
    }

    @Transactional(readOnly = true)
    public AcademicTerm getAcademicTermEntity(Long termId) {
        return academicTermRepository.findDetailedById(termId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private AcademicYear getAcademicYearEntity(Long academicYearId) {
        return academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private List<Long> normalizeSubTermIds(List<Long> subTermIds) {
        if (subTermIds == null) {
            return List.of();
        }

        if (subTermIds.stream().anyMatch(Objects::isNull)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term IDs cannot contain null values."
            );
        }

        return List.copyOf(subTermIds);
    }

    private List<AcademicSubTerm> getAcademicSubTerms(List<Long> subTermIds) {
        if (subTermIds.isEmpty()) {
            return List.of();
        }

        List<AcademicSubTerm> academicSubTerms =
                academicSubTermRepository.findAllByIdInOrderBySortOrderAsc(subTermIds);
        Set<Long> foundIds = academicSubTerms.stream()
                .map(AcademicSubTerm::getId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        if (foundIds.size() != new LinkedHashSet<>(subTermIds).size()) {
            List<Long> missingIds = subTermIds.stream()
                    .filter(subTermId -> !foundIds.contains(subTermId))
                    .distinct()
                    .toList();
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub terms not found for IDs: " + missingIds
            );
        }

        return academicSubTerms;
    }

    private List<Long> extractAcademicSubTermIds(List<AcademicSubTerm> academicSubTerms) {
        if (academicSubTerms == null) {
            return List.of();
        }

        return academicSubTerms.stream()
                .map(AcademicSubTerm::getId)
                .toList();
    }

    private void replaceAcademicSubTerms(AcademicTerm academicTerm, List<AcademicSubTerm> academicSubTerms) {
        academicTerm.getAcademicSubTerms().clear();
        academicTerm.getAcademicSubTerms().addAll(academicSubTerms);
    }

    private Map<Long, Long> getCourseOfferingCountsBySubTermId(List<AcademicTerm> academicTerms) {
        List<Long> subTermIds = academicTerms.stream()
                .flatMap(term -> term.getAcademicSubTerms().stream())
                .map(AcademicSubTerm::getId)
                .distinct()
                .toList();

        if (subTermIds.isEmpty()) {
            return Map.of();
        }

        return courseOfferingRepository.countBySubTermIds(subTermIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CourseOfferingRepository.SubTermCourseOfferingCount::getSubTermId,
                        CourseOfferingRepository.SubTermCourseOfferingCount::getCourseOfferingCount
                ));
    }

    private boolean hasPatchableChanges(
            AcademicTerm existingAcademicTerm,
            AcademicTerm candidateAcademicTerm,
            List<AcademicSubTerm> requestedAcademicSubTerms
    ) {
        List<Long> existingSubTermIds = extractAcademicSubTermIds(existingAcademicTerm.getAcademicSubTerms());
        List<Long> requestedSubTermIds = extractAcademicSubTermIds(requestedAcademicSubTerms);

        return !Objects.equals(existingAcademicTerm.getCode(), candidateAcademicTerm.getCode())
                || !Objects.equals(existingAcademicTerm.getName(), candidateAcademicTerm.getName())
                || !Objects.equals(existingAcademicTerm.getStartDate(), candidateAcademicTerm.getStartDate())
                || !Objects.equals(existingAcademicTerm.getEndDate(), candidateAcademicTerm.getEndDate())
                || !Objects.equals(existingSubTermIds, requestedSubTermIds);
    }
}
