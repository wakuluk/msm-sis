package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicTermGroupResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermGroupRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermGroupRequest;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermGroup;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.mapper.AcademicTermGroupMapper;
import com.msm.sis.api.repository.AcademicTermGroupRepository;
import com.msm.sis.api.repository.AcademicTermRepository;
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
public class AcademicTermGroupService {

    private final AcademicTermGroupRepository academicTermGroupRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AcademicTermRepository academicTermRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final AcademicValidationService academicValidationService;
    private final AcademicTermGroupMapper academicTermGroupMapper;
    private final EntityManager entityManager;

    public AcademicTermGroupService(
            AcademicTermGroupRepository academicTermGroupRepository,
            AcademicYearRepository academicYearRepository,
            AcademicTermRepository academicTermRepository,
            CourseOfferingRepository courseOfferingRepository,
            AcademicValidationService academicValidationService,
            AcademicTermGroupMapper academicTermGroupMapper,
            EntityManager entityManager
    ) {
        this.academicTermGroupRepository = academicTermGroupRepository;
        this.academicYearRepository = academicYearRepository;
        this.academicTermRepository = academicTermRepository;
        this.courseOfferingRepository = courseOfferingRepository;
        this.academicValidationService = academicValidationService;
        this.academicTermGroupMapper = academicTermGroupMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public AcademicTermGroupResponse createAcademicTermGroup(
            Long academicYearId,
            CreateAcademicTermGroupRequest request
    ) {
        AcademicYear academicYear = getAcademicYearEntity(academicYearId);
        List<Long> termIds = normalizeTermIds(request.termIds());
        List<AcademicTerm> academicTerms = getAcademicTerms(termIds);

        AcademicTermGroup academicTermGroup = academicTermGroupMapper.fromCreateAcademicTermGroupRequest(
                academicYear,
                request
        );

        academicValidationService.validateCreateAcademicTermGroup(
                academicYear,
                academicTermGroup,
                termIds,
                academicTerms
        );

        academicTermGroup.getAcademicTerms().addAll(academicTerms);
        AcademicTermGroup savedAcademicTermGroup = academicTermGroupRepository.save(academicTermGroup);
        entityManager.flush();
        entityManager.clear();
        return getAcademicTermGroup(savedAcademicTermGroup.getId());
    }

    @Transactional(readOnly = true)
    public List<AcademicTermGroupResponse> getAcademicTermGroups(Long academicYearId) {
        getAcademicYearEntity(academicYearId);
        List<AcademicTermGroup> academicTermGroups =
                academicTermGroupRepository.findAllByAcademicYear_IdOrderByStartDateAsc(academicYearId);
        Map<Long, Long> courseOfferingCountsByTermId = getCourseOfferingCountsByTermId(academicTermGroups);

        return academicTermGroups.stream()
                .map(academicTermGroup ->
                        academicTermGroupMapper.toAcademicTermGroupResponse(
                                academicTermGroup,
                                courseOfferingCountsByTermId
                        )
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public AcademicTermGroupResponse getAcademicTermGroup(Long termGroupId) {
        AcademicTermGroup academicTermGroup = getAcademicTermGroupEntity(termGroupId);
        return academicTermGroupMapper.toAcademicTermGroupResponse(
                academicTermGroup,
                getCourseOfferingCountsByTermId(List.of(academicTermGroup))
        );
    }

    @Transactional
    public AcademicTermGroupResponse patchAcademicTermGroup(
            Long termGroupId,
            PatchAcademicTermGroupRequest request
    ) {
        AcademicTermGroup existingAcademicTermGroup = getAcademicTermGroupEntity(termGroupId);
        AcademicTermGroup candidateAcademicTermGroup = academicTermGroupMapper.copy(existingAcademicTermGroup);

        if (request.getTermGroupId() != null && !Objects.equals(request.getTermGroupId(), termGroupId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term group ID in the request does not match the target academic term group."
            );
        }

        academicTermGroupMapper.applyPatch(candidateAcademicTermGroup, request);

        List<Long> requestedTermIds = request.getTermIds().isPresent()
                ? normalizeTermIds(request.getTermIds().orElse(List.of()))
                : extractAcademicTermIds(existingAcademicTermGroup.getAcademicTerms());

        List<AcademicTerm> requestedAcademicTerms = request.getTermIds().isPresent()
                ? getAcademicTerms(requestedTermIds)
                : List.copyOf(existingAcademicTermGroup.getAcademicTerms());

        academicValidationService.validatePatchAcademicTermGroup(
                existingAcademicTermGroup,
                candidateAcademicTermGroup,
                requestedTermIds,
                requestedAcademicTerms
        );

        if (!hasPatchableChanges(existingAcademicTermGroup, candidateAcademicTermGroup, requestedAcademicTerms)) {
            return getAcademicTermGroup(termGroupId);
        }

        academicTermGroupMapper.copyPatchableFields(candidateAcademicTermGroup, existingAcademicTermGroup);
        replaceAcademicTerms(existingAcademicTermGroup, requestedAcademicTerms);
        academicTermGroupRepository.save(existingAcademicTermGroup);
        entityManager.flush();
        entityManager.clear();
        return getAcademicTermGroup(termGroupId);
    }

    @Transactional(readOnly = true)
    public AcademicTermGroup getAcademicTermGroupEntity(Long termGroupId) {
        return academicTermGroupRepository.findDetailedById(termGroupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private AcademicYear getAcademicYearEntity(Long academicYearId) {
        return academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private List<Long> normalizeTermIds(List<Long> termIds) {
        if (termIds == null) {
            return List.of();
        }

        if (termIds.stream().anyMatch(Objects::isNull)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term IDs cannot contain null values."
            );
        }

        return List.copyOf(termIds);
    }

    private List<AcademicTerm> getAcademicTerms(List<Long> termIds) {
        if (termIds.isEmpty()) {
            return List.of();
        }

        List<AcademicTerm> academicTerms = academicTermRepository.findAllByIdInOrderBySortOrderAsc(termIds);
        Set<Long> foundIds = academicTerms.stream()
                .map(AcademicTerm::getId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        if (foundIds.size() != new LinkedHashSet<>(termIds).size()) {
            List<Long> missingIds = termIds.stream()
                    .filter(termId -> !foundIds.contains(termId))
                    .distinct()
                    .toList();
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic terms not found for IDs: " + missingIds
            );
        }

        return academicTerms;
    }

    private List<Long> extractAcademicTermIds(List<AcademicTerm> academicTerms) {
        if (academicTerms == null) {
            return List.of();
        }

        return academicTerms.stream()
                .map(AcademicTerm::getId)
                .toList();
    }

    private void replaceAcademicTerms(AcademicTermGroup academicTermGroup, List<AcademicTerm> academicTerms) {
        academicTermGroup.getAcademicTerms().clear();
        academicTermGroup.getAcademicTerms().addAll(academicTerms);
    }

    private Map<Long, Long> getCourseOfferingCountsByTermId(List<AcademicTermGroup> academicTermGroups) {
        List<Long> termIds = academicTermGroups.stream()
                .flatMap(academicTermGroup -> academicTermGroup.getAcademicTerms().stream())
                .map(AcademicTerm::getId)
                .distinct()
                .toList();

        if (termIds.isEmpty()) {
            return Map.of();
        }

        return courseOfferingRepository.countByTermIds(termIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CourseOfferingRepository.TermCourseOfferingCount::getTermId,
                        CourseOfferingRepository.TermCourseOfferingCount::getCourseOfferingCount
                ));
    }

    private boolean hasPatchableChanges(
            AcademicTermGroup existingAcademicTermGroup,
            AcademicTermGroup candidateAcademicTermGroup,
            List<AcademicTerm> requestedAcademicTerms
    ) {
        List<Long> existingTermIds = extractAcademicTermIds(existingAcademicTermGroup.getAcademicTerms());
        List<Long> requestedTermIds = extractAcademicTermIds(requestedAcademicTerms);

        return !Objects.equals(existingAcademicTermGroup.getCode(), candidateAcademicTermGroup.getCode())
                || !Objects.equals(existingAcademicTermGroup.getName(), candidateAcademicTermGroup.getName())
                || !Objects.equals(existingAcademicTermGroup.getStartDate(), candidateAcademicTermGroup.getStartDate())
                || !Objects.equals(existingAcademicTermGroup.getEndDate(), candidateAcademicTermGroup.getEndDate())
                || !Objects.equals(existingTermIds, requestedTermIds);
    }
}
