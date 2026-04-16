package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicTermStatusShiftDirection;
import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.AcademicTermStatusResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.dto.course.CourseOfferingSearchSortField;
import com.msm.sis.api.dto.course.CourseOfferingSearchResultResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermStatus;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicTermStatusRepository;
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
public class AcademicTermService {
    private static final String PLANNED_TERM_STATUS_CODE = "PLANNED";

    private final AcademicValidationService academicValidationService;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicTermStatusRepository academicTermStatusRepository;
    private final AcademicYearRepository academicYearRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final AcademicYearMapper academicYearMapper;
    private final CourseMapper courseMapper;
    private final EntityManager entityManager;

    public AcademicTermService(
            AcademicValidationService academicValidationService,
            AcademicTermRepository academicTermRepository,
            AcademicTermStatusRepository academicTermStatusRepository,
            AcademicYearRepository academicYearRepository,
            CourseOfferingRepository courseOfferingRepository,
            AcademicYearMapper academicYearMapper,
            CourseMapper courseMapper,
            EntityManager entityManager
    ) {
        this.academicValidationService = academicValidationService;
        this.academicTermRepository = academicTermRepository;
        this.academicTermStatusRepository = academicTermStatusRepository;
        this.academicYearRepository = academicYearRepository;
        this.courseOfferingRepository = courseOfferingRepository;
        this.academicYearMapper = academicYearMapper;
        this.courseMapper = courseMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public List<AcademicTermResponse> createAcademicTerms(
            Long academicYearId,
            List<CreateAcademicTermRequest> createAcademicTermRequestList)
    {
        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (createAcademicTermRequestList == null || createAcademicTermRequestList.isEmpty()) {
            return List.of();
        }

        academicValidationService.validateCreateAcademicTerms(
                academicYear,
                academicYearId,
                createAcademicTermRequestList
        );

        return createAcademicTermRequestList.stream()
                .map(createAcademicTermRequest -> saveAcademicTerm(academicYear, createAcademicTermRequest))
                .toList();
    }

    @Transactional(readOnly = true)
    public AcademicTermResponse getAcademicTerm(Long termId) {
        return academicYearMapper.toAcademicTermResponse(getAcademicTermEntity(termId));
    }

    @Transactional(readOnly = true)
    public List<AcademicTermStatusResponse> getAcademicTermStatuses() {
        return academicTermStatusRepository.findAllByOrderBySortOrderAsc().stream()
                .map(status -> new AcademicTermStatusResponse(
                        status.getCode(),
                        status.getName(),
                        status.getSortOrder()
                ))
                .toList();
    }

    @Transactional
    public AcademicTermResponse patchAcademicTerm(
            Long termId,
            PatchAcademicTermRequest patchAcademicTermRequest,
            String updatedBy
    ) {
        //TODO review!
        AcademicTerm existingAcademicTerm = getAcademicTermEntity(termId);
        AcademicTerm candidateAcademicTerm = copyAcademicTerm(existingAcademicTerm);

        if (patchAcademicTermRequest.getTermId() != null
                && !Objects.equals(patchAcademicTermRequest.getTermId(), termId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term ID in the request does not match the target academic term."
            );
        }

        academicYearMapper.applyPatch(candidateAcademicTerm, patchAcademicTermRequest);
        academicValidationService.validatePatchAcademicTerm(
                existingAcademicTerm,
                candidateAcademicTerm
        );

        if (!hasPatchableChanges(existingAcademicTerm, candidateAcademicTerm)) {
            return getAcademicTerm(termId);
        }

        copyPatchableFields(candidateAcademicTerm, existingAcademicTerm);
        existingAcademicTerm.setUpdatedBy(updatedBy);
        academicTermRepository.save(existingAcademicTerm);
        entityManager.flush();
        entityManager.clear();
        return getAcademicTerm(termId);
    }

    @Transactional(readOnly = true)
    public List<CourseOfferingSearchResultResponse> getCourseOfferingsForAcademicTerm(
            Long termId,
            String sortBy,
            String sortDirection
    ) {
        getAcademicTermEntity(termId);
        CourseOfferingSearchSortField sortField = parseCourseOfferingSortField(sortBy);
        Sort.Direction direction = parseSortDirection(sortDirection);

        return courseOfferingRepository.findAllByTerm_Id(
                        termId,
                        buildCourseOfferingSort(sortField, direction)
                ).stream()
                .map(courseMapper::toCourseOfferingSearchResultResponse)
                .toList();
    }

    @Transactional
    public AcademicTermResponse shiftAcademicTermStatus(
            Long termId,
            AcademicTermStatusShiftDirection direction,
            String updatedBy
    ) {
        if (direction == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status shift direction is required."
            );
        }

        AcademicTerm academicTerm = getAcademicTermEntity(termId);
        AcademicTermStatus currentStatus = academicTerm.getStatus();

        if (currentStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term does not have a current status."
            );
        }

        if (!currentStatus.isActive() || !currentStatus.isAllowLinearShift()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current academic term status cannot be shifted linearly."
            );
        }

        List<AcademicTermStatus> linearStatuses = academicTermStatusRepository
                .findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();

        int currentIndex = findAcademicTermStatusIndex(linearStatuses, currentStatus.getId());

        if (currentIndex < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current academic term status is not part of the linear status flow."
            );
        }

        int targetIndex = direction == AcademicTermStatusShiftDirection.UP
                ? currentIndex + 1
                : currentIndex - 1;

        if (targetIndex < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term is already at the first workflow step."
            );
        }

        if (targetIndex >= linearStatuses.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term is already at the final workflow step."
            );
        }

        academicTerm.setStatus(linearStatuses.get(targetIndex));
        academicTerm.setUpdatedBy(updatedBy);
        academicTermRepository.save(academicTerm);
        entityManager.flush();
        entityManager.clear();
        return getAcademicTerm(termId);
    }

    @Transactional
    public List<AcademicTermResponse> createAcademicTerms(
            AcademicYear academicYear,
            List<CreateAcademicYearTermRequest> createAcademicTermRequestList)
    {
        if (createAcademicTermRequestList == null || createAcademicTermRequestList.isEmpty()) {
            return List.of();
        }

        academicValidationService.validateCreateAcademicTerms(academicYear, createAcademicTermRequestList);

        return createAcademicTermRequestList.stream()
                .map(createAcademicTermRequest -> saveAcademicYearTerm(academicYear, createAcademicTermRequest))
                .toList();
    }

    @Transactional
    public AcademicTermResponse createAcademicTerm(
            AcademicYear academicYear,
            CreateAcademicYearTermRequest createAcademicTermRequest
    ){
        academicValidationService.validateCreateAcademicTerm(academicYear, createAcademicTermRequest);
        return saveAcademicYearTerm(academicYear, createAcademicTermRequest);
    }

    @Transactional
    public AcademicTermResponse createAcademicTerm(AcademicYear academicYear, CreateAcademicTermRequest createAcademicTermRequest){
        if (academicYear.getId() == null || !academicYear.getId().equals(createAcademicTermRequest.academicYearId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year ID in the request does not match the target academic year."
            );
        }

        academicValidationService.validateCreateAcademicTerm(academicYear, createAcademicTermRequest);
        return saveAcademicTerm(academicYear, createAcademicTermRequest);
    }

    private AcademicTermResponse saveAcademicYearTerm(
            AcademicYear academicYear,
            CreateAcademicYearTermRequest createAcademicTermRequest
    ) {
        AcademicTermStatus termStatus = getPlannedTermStatus();
        AcademicTerm academicTerm = academicYearMapper.fromCreateAcademicYearTermRequest(
                academicYear,
                termStatus,
                createAcademicTermRequest
        );
        AcademicTerm savedAcademicTerm = academicTermRepository.save(academicTerm);
        return academicYearMapper.toAcademicTermResponse(savedAcademicTerm);
    }

    private AcademicTermResponse saveAcademicTerm(
            AcademicYear academicYear,
            CreateAcademicTermRequest createAcademicTermRequest
    ) {
        AcademicTermStatus termStatus = getPlannedTermStatus();
        AcademicTerm academicTerm = academicYearMapper.fromCreateAcademicTermRequest(
                academicYear,
                termStatus,
                createAcademicTermRequest
        );
        AcademicTerm savedAcademicTerm = academicTermRepository.save(academicTerm);
        return academicYearMapper.toAcademicTermResponse(savedAcademicTerm);
    }

    private AcademicTermStatus getPlannedTermStatus() {
        return academicTermStatusRepository.findByCode(trimToNull(PLANNED_TERM_STATUS_CODE))
                .filter(AcademicTermStatus::isActive)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term status 'PLANNED' must exist and be active."
                ));
    }

    private AcademicTerm getAcademicTermEntity(Long termId) {
        return academicTermRepository.findDetailedById(termId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private int findAcademicTermStatusIndex(List<AcademicTermStatus> statuses, Long statusId) {
        for (int index = 0; index < statuses.size(); index += 1) {
            if (Objects.equals(statuses.get(index).getId(), statusId)) {
                return index;
            }
        }

        return -1;
    }

    private AcademicTerm copyAcademicTerm(AcademicTerm academicTerm) {
        AcademicTerm copy = new AcademicTerm();
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

    private void copyPatchableFields(AcademicTerm source, AcademicTerm target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setStartDate(source.getStartDate());
        target.setEndDate(source.getEndDate());
        target.setSortOrder(source.getSortOrder());
    }

    private boolean hasPatchableChanges(AcademicTerm existingAcademicTerm, AcademicTerm candidateAcademicTerm) {
        return !Objects.equals(existingAcademicTerm.getCode(), candidateAcademicTerm.getCode())
                || !Objects.equals(existingAcademicTerm.getName(), candidateAcademicTerm.getName())
                || !Objects.equals(existingAcademicTerm.getStartDate(), candidateAcademicTerm.getStartDate())
                || !Objects.equals(existingAcademicTerm.getEndDate(), candidateAcademicTerm.getEndDate())
                || !Objects.equals(existingAcademicTerm.getSortOrder(), candidateAcademicTerm.getSortOrder());
    }

    private CourseOfferingSearchSortField parseCourseOfferingSortField(String sortBy) {
        try {
            return CourseOfferingSearchSortField.fromRequestValue(sortBy);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: academicYearCode, termCode, departmentCode, subjectCode, courseNumber, courseCode, title, minCredits, maxCredits, variableCredit, offeringStatusCode."
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
