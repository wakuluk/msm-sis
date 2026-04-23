package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicSubTermStatusShiftDirection;
import com.msm.sis.api.dto.academic.term.AcademicSubTermResponse;
import com.msm.sis.api.dto.academic.term.AcademicSubTermStatusResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicSubTermRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicSubTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearSubTermRequest;
import com.msm.sis.api.dto.course.CourseOfferingSearchSortField;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicSubTermStatus;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.AcademicSubTermStatusRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.CourseOfferingRepository;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicSubTermService {
    private static final String PLANNED_SUB_TERM_STATUS_CODE = "PLANNED";

    private final AcademicValidationService academicValidationService;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicSubTermRepository academicSubTermRepository;
    private final AcademicSubTermStatusRepository academicSubTermStatusRepository;
    private final AcademicYearRepository academicYearRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final AcademicYearMapper academicYearMapper;
    private final CourseMapper courseMapper;
    private final EntityManager entityManager;

    public AcademicSubTermService(
            AcademicValidationService academicValidationService,
            AcademicTermRepository academicTermRepository,
            AcademicSubTermRepository academicSubTermRepository,
            AcademicSubTermStatusRepository academicSubTermStatusRepository,
            AcademicYearRepository academicYearRepository,
            CourseOfferingRepository courseOfferingRepository,
            AcademicYearMapper academicYearMapper,
            CourseMapper courseMapper,
            EntityManager entityManager
    ) {
        this.academicValidationService = academicValidationService;
        this.academicTermRepository = academicTermRepository;
        this.academicSubTermRepository = academicSubTermRepository;
        this.academicSubTermStatusRepository = academicSubTermStatusRepository;
        this.academicYearRepository = academicYearRepository;
        this.courseOfferingRepository = courseOfferingRepository;
        this.academicYearMapper = academicYearMapper;
        this.courseMapper = courseMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public List<AcademicSubTermResponse> createAcademicSubTerms(
            Long academicYearId,
            List<CreateAcademicSubTermRequest> createAcademicSubTermRequestList)
    {
        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (createAcademicSubTermRequestList == null || createAcademicSubTermRequestList.isEmpty()) {
            return List.of();
        }

        academicValidationService.validateCreateAcademicSubTerms(
                academicYear,
                academicYearId,
                createAcademicSubTermRequestList
        );

        return createAcademicSubTermRequestList.stream()
                .map(createAcademicSubTermRequest -> saveAcademicSubTerm(academicYear, createAcademicSubTermRequest))
                .toList();
    }

    @Transactional(readOnly = true)
    public AcademicSubTermResponse getAcademicSubTerm(Long subTermId) {
        return academicYearMapper.toAcademicSubTermResponse(getAcademicSubTermEntity(subTermId));
    }

    @Transactional(readOnly = true)
    public List<AcademicSubTermResponse> getAcademicSubTerms(Long academicYearId) {
        academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return academicSubTermRepository.findAllByAcademicYear_IdOrderBySortOrderAsc(academicYearId).stream()
                .map(academicYearMapper::toAcademicSubTermResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AcademicSubTermStatusResponse> getAcademicSubTermStatuses() {
        return academicSubTermStatusRepository.findAllByOrderBySortOrderAsc().stream()
                .map(status -> new AcademicSubTermStatusResponse(
                        status.getCode(),
                        status.getName(),
                        status.getSortOrder()
                ))
                .toList();
    }

    @Transactional
    public AcademicSubTermResponse patchAcademicSubTerm(
            Long subTermId,
            PatchAcademicSubTermRequest patchAcademicSubTermRequest,
            String updatedBy
    ) {
        AcademicSubTerm existingAcademicSubTerm = getAcademicSubTermEntity(subTermId);
        AcademicSubTerm candidateAcademicSubTerm = copyAcademicSubTerm(existingAcademicSubTerm);

        if (patchAcademicSubTermRequest.getSubTermId() != null
                && !Objects.equals(patchAcademicSubTermRequest.getSubTermId(), subTermId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term ID in the request does not match the target academic sub term."
            );
        }

        academicYearMapper.applyPatch(candidateAcademicSubTerm, patchAcademicSubTermRequest);
        academicValidationService.validatePatchAcademicSubTerm(
                existingAcademicSubTerm,
                candidateAcademicSubTerm
        );
        validateContainingTermConstraints(candidateAcademicSubTerm);

        if (!hasPatchableChanges(existingAcademicSubTerm, candidateAcademicSubTerm)) {
            return getAcademicSubTerm(subTermId);
        }

        copyPatchableFields(candidateAcademicSubTerm, existingAcademicSubTerm);
        existingAcademicSubTerm.setUpdatedBy(updatedBy);
        academicSubTermRepository.save(existingAcademicSubTerm);
        entityManager.flush();
        entityManager.clear();
        return getAcademicSubTerm(subTermId);
    }

    @Transactional(readOnly = true)
    public List<CourseOfferingSearchResultResponse> getCourseOfferingsForAcademicSubTerm(
            Long subTermId,
            String sortBy,
            String sortDirection
    ) {
        AcademicSubTerm academicSubTerm = getAcademicSubTermEntity(subTermId);
        CourseOfferingSearchSortField sortField = parseCourseOfferingSortField(sortBy);
        Sort.Direction direction = parseSortDirection(sortDirection);

        return courseOfferingRepository.findAllByAcademicSubTermId(
                        subTermId,
                        buildCourseOfferingSort(sortField, direction)
                ).stream()
                .map(courseOffering ->
                        courseMapper.toCourseOfferingSearchResultResponse(courseOffering, academicSubTerm)
                )
                .toList();
    }

    @Transactional
    public AcademicSubTermResponse shiftAcademicSubTermStatus(
            Long subTermId,
            AcademicSubTermStatusShiftDirection direction,
            String updatedBy
    ) {
        if (direction == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status shift direction is required."
            );
        }

        AcademicSubTerm academicSubTerm = getAcademicSubTermEntity(subTermId);
        AcademicSubTermStatus currentStatus = academicSubTerm.getStatus();

        if (currentStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term does not have a current status."
            );
        }

        if (!currentStatus.isActive() || !currentStatus.isAllowLinearShift()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current academic sub term status cannot be shifted linearly."
            );
        }

        List<AcademicSubTermStatus> linearStatuses = academicSubTermStatusRepository
                .findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();

        int currentIndex = findAcademicSubTermStatusIndex(linearStatuses, currentStatus.getId());

        if (currentIndex < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current academic sub term status is not part of the linear status flow."
            );
        }

        int targetIndex = direction == AcademicSubTermStatusShiftDirection.UP
                ? currentIndex + 1
                : currentIndex - 1;

        if (targetIndex < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term is already at the first workflow step."
            );
        }

        if (targetIndex >= linearStatuses.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term is already at the final workflow step."
            );
        }

        academicSubTerm.setStatus(linearStatuses.get(targetIndex));
        academicSubTerm.setUpdatedBy(updatedBy);
        academicSubTermRepository.save(academicSubTerm);
        entityManager.flush();
        entityManager.clear();
        return getAcademicSubTerm(subTermId);
    }

    @Transactional
    public List<AcademicSubTermResponse> createAcademicSubTerms(
            AcademicYear academicYear,
            List<CreateAcademicYearSubTermRequest> createAcademicSubTermRequestList)
    {
        if (createAcademicSubTermRequestList == null || createAcademicSubTermRequestList.isEmpty()) {
            return List.of();
        }

        academicValidationService.validateCreateAcademicSubTerms(
                academicYear,
                createAcademicSubTermRequestList
        );

        return createAcademicSubTermRequestList.stream()
                .map(createAcademicSubTermRequest ->
                        saveAcademicYearSubTerm(academicYear, createAcademicSubTermRequest)
                )
                .toList();
    }

    @Transactional
    public AcademicSubTermResponse createAcademicSubTerm(
            AcademicYear academicYear,
            CreateAcademicYearSubTermRequest createAcademicSubTermRequest
    ){
        academicValidationService.validateCreateAcademicSubTerm(academicYear, createAcademicSubTermRequest);
        return saveAcademicYearSubTerm(academicYear, createAcademicSubTermRequest);
    }

    @Transactional
    public AcademicSubTermResponse createAcademicSubTerm(
            AcademicYear academicYear,
            CreateAcademicSubTermRequest createAcademicSubTermRequest
    ) {
        if (academicYear.getId() == null
                || !academicYear.getId().equals(createAcademicSubTermRequest.academicYearId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year ID in the request does not match the target academic year."
            );
        }

        academicValidationService.validateCreateAcademicSubTerm(academicYear, createAcademicSubTermRequest);
        return saveAcademicSubTerm(academicYear, createAcademicSubTermRequest);
    }

    private AcademicSubTermResponse saveAcademicYearSubTerm(
            AcademicYear academicYear,
            CreateAcademicYearSubTermRequest createAcademicSubTermRequest
    ) {
        AcademicSubTermStatus subTermStatus = getPlannedSubTermStatus();
        AcademicSubTerm academicSubTerm = academicYearMapper.fromCreateAcademicYearSubTermRequest(
                academicYear,
                subTermStatus,
                createAcademicSubTermRequest
        );
        AcademicSubTerm savedAcademicSubTerm = academicSubTermRepository.save(academicSubTerm);
        return academicYearMapper.toAcademicSubTermResponse(savedAcademicSubTerm);
    }

    private AcademicSubTermResponse saveAcademicSubTerm(
            AcademicYear academicYear,
            CreateAcademicSubTermRequest createAcademicSubTermRequest
    ) {
        AcademicSubTermStatus subTermStatus = getPlannedSubTermStatus();
        AcademicSubTerm academicSubTerm = academicYearMapper.fromCreateAcademicSubTermRequest(
                academicYear,
                subTermStatus,
                createAcademicSubTermRequest
        );
        AcademicSubTerm savedAcademicSubTerm = academicSubTermRepository.save(academicSubTerm);
        return academicYearMapper.toAcademicSubTermResponse(savedAcademicSubTerm);
    }

    private AcademicSubTermStatus getPlannedSubTermStatus() {
        return academicSubTermStatusRepository.findByCode(trimToNull(PLANNED_SUB_TERM_STATUS_CODE))
                .filter(AcademicSubTermStatus::isActive)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term status 'PLANNED' must exist and be active."
                ));
    }

    private AcademicSubTerm getAcademicSubTermEntity(Long subTermId) {
        return academicSubTermRepository.findDetailedById(subTermId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private int findAcademicSubTermStatusIndex(List<AcademicSubTermStatus> statuses, Long statusId) {
        for (int index = 0; index < statuses.size(); index += 1) {
            if (Objects.equals(statuses.get(index).getId(), statusId)) {
                return index;
            }
        }

        return -1;
    }

    private AcademicSubTerm copyAcademicSubTerm(AcademicSubTerm academicTerm) {
        AcademicSubTerm copy = new AcademicSubTerm();
        copy.setId(academicTerm.getId());
        copy.setAcademicYear(academicTerm.getAcademicYear());
        copy.setCode(academicTerm.getCode());
        copy.setName(academicTerm.getName());
        copy.setStartDate(academicTerm.getStartDate());
        copy.setEndDate(academicTerm.getEndDate());
        copy.setSortOrder(academicTerm.getSortOrder());
        copy.setStatus(academicTerm.getStatus());
        copy.setActive(academicTerm.isActive());
        copy.setLastUpdated(academicTerm.getLastUpdated());
        copy.setUpdatedBy(academicTerm.getUpdatedBy());
        return copy;
    }

    private void copyPatchableFields(AcademicSubTerm source, AcademicSubTerm target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setStartDate(source.getStartDate());
        target.setEndDate(source.getEndDate());
        target.setSortOrder(source.getSortOrder());
    }

    private boolean hasPatchableChanges(
            AcademicSubTerm existingAcademicSubTerm,
            AcademicSubTerm candidateAcademicSubTerm
    ) {
        return !Objects.equals(existingAcademicSubTerm.getCode(), candidateAcademicSubTerm.getCode())
                || !Objects.equals(existingAcademicSubTerm.getName(), candidateAcademicSubTerm.getName())
                || !Objects.equals(existingAcademicSubTerm.getStartDate(), candidateAcademicSubTerm.getStartDate())
                || !Objects.equals(existingAcademicSubTerm.getEndDate(), candidateAcademicSubTerm.getEndDate())
                || !Objects.equals(existingAcademicSubTerm.getSortOrder(), candidateAcademicSubTerm.getSortOrder());
    }

    private void validateContainingTermConstraints(AcademicSubTerm academicSubTerm) {
        if (academicSubTerm.getId() == null) {
            return;
        }

        AcademicTerm academicTerm = academicTermRepository.findByAcademicSubTerms_Id(academicSubTerm.getId())
                .orElse(null);
        academicValidationService.validateAcademicSubTermWithinContainingTerm(academicTerm, academicSubTerm);
    }

    private CourseOfferingSearchSortField parseCourseOfferingSortField(String sortBy) {
        try {
            return CourseOfferingSearchSortField.fromRequestValue(sortBy);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: academicYearCode, subTermCode, departmentCode, subjectCode, courseNumber, courseCode, title, minCredits, maxCredits, variableCredit, offeringStatusCode."
            );
        }
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        try {
            return Sort.Direction.fromString(sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

    private Sort buildCourseOfferingSort(
            CourseOfferingSearchSortField sortField,
            Sort.Direction sortDirection
    ) {
        return sortField.toSort(sortDirection)
                .and(Sort.by("courseVersion.course.subject.code").ascending())
                .and(Sort.by("courseVersion.course.courseNumber").ascending())
                .and(Sort.by("courseVersion.versionNumber").descending())
                .and(Sort.by("id").ascending());
    }
}
