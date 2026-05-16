package com.msm.sis.api.service.billing;

import com.msm.sis.api.dto.billing.BillingPeriodDetailResponse;
import com.msm.sis.api.dto.billing.BillingPeriodRunResponse;
import com.msm.sis.api.dto.billing.BillingPeriodSearchResponse;
import com.msm.sis.api.dto.billing.BillingPeriodSearchResultResponse;
import com.msm.sis.api.dto.billing.CreateBillingPeriodRequest;
import com.msm.sis.api.dto.billing.PatchBillingPeriodRequest;
import com.msm.sis.api.dto.billing.RunBillingPeriodRequest;
import com.msm.sis.api.dto.billing.RunBillingPeriodResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.BillingPeriod;
import com.msm.sis.api.entity.BillingPeriodRun;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.patch.PatchValue;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.BillingPeriodRepository;
import com.msm.sis.api.repository.BillingPeriodRunRepository;
import com.msm.sis.api.repository.SisUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.patch.PatchUtils.apply;
import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
public class BillingPeriodService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> BILLING_PERIOD_TYPES = Set.of("STANDARD", "OPEN_ENDED");
    private static final List<String> BILLING_PERIOD_STATUSES = List.of("DRAFT", "PUBLISHED", "ARCHIVED");
    private static final Set<String> BILLING_BASE_DATE_BASES = Set.of(
            "BILLING_PERIOD_START_DATE",
            "BILLING_PERIOD_END_DATE",
            "ACTUAL_START_PRELIMINARY_END_DATE"
    );
    private static final String DEFAULT_RUN_MESSAGE = "Billing run queued. No charges have been generated yet.";

    private final BillingPeriodRepository billingPeriodRepository;
    private final BillingPeriodRunRepository billingPeriodRunRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AcademicTermRepository academicTermRepository;
    private final SisUserRepository sisUserRepository;

    public BillingPeriodService(
            BillingPeriodRepository billingPeriodRepository,
            BillingPeriodRunRepository billingPeriodRunRepository,
            AcademicYearRepository academicYearRepository,
            AcademicTermRepository academicTermRepository,
            SisUserRepository sisUserRepository
    ) {
        this.billingPeriodRepository = billingPeriodRepository;
        this.billingPeriodRunRepository = billingPeriodRunRepository;
        this.academicYearRepository = academicYearRepository;
        this.academicTermRepository = academicTermRepository;
        this.sisUserRepository = sisUserRepository;
    }

    @Transactional(readOnly = true)
    public BillingPeriodSearchResponse searchBillingPeriods(
            String name,
            String description,
            String status,
            String academicTerm,
            String financialAidPeriod,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        validatePageRequest(page, size, MAX_PAGE_SIZE);
        String normalizedStatus = normalizeOptionalStatus(status);

        Page<BillingPeriod> billingPeriodPage = billingPeriodRepository.searchBillingPeriods(
                toLikePattern(name),
                toLikePattern(description),
                normalizedStatus,
                toLikePattern(academicTerm),
                toLikePattern(financialAidPeriod),
                PageRequest.of(page, size, buildBillingPeriodSort(sortBy, sortDirection))
        );

        return new BillingPeriodSearchResponse(
                billingPeriodPage.getContent().stream()
                        .map(this::toSearchResultResponse)
                        .toList(),
                billingPeriodPage.getNumber(),
                billingPeriodPage.getSize(),
                billingPeriodPage.getTotalElements(),
                billingPeriodPage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public BillingPeriodDetailResponse getBillingPeriodDetail(Long billingPeriodId) {
        return toDetailResponse(getBillingPeriodEntity(billingPeriodId));
    }

    @Transactional
    public BillingPeriodDetailResponse createBillingPeriod(
            CreateBillingPeriodRequest request,
            Long createdByUserId
    ) {
        requireRequestBody(request);

        BillingPeriod billingPeriod = new BillingPeriod();
        billingPeriod.setName(normalizeName(request.name()));
        billingPeriod.setDescription(trimToNull(request.description()));
        billingPeriod.setType(normalizeType(request.type()));
        billingPeriod.setStatus(normalizeStatus(request.status()));
        applyCreateRequestFields(billingPeriod, request);

        validateBillingPeriodFields(billingPeriod);

        if (billingPeriodRepository.existsByNameIgnoreCase(billingPeriod.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing period already exists.");
        }

        resolveAcademicMapping(billingPeriod, request.academicYearId(), request.termId());

        SisUser createdByUser = resolveUser(createdByUserId);
        billingPeriod.setCreatedByUser(createdByUser);
        billingPeriod.setUpdatedByUser(createdByUser);

        return toDetailResponse(billingPeriodRepository.save(billingPeriod));
    }

    @Transactional
    public BillingPeriodDetailResponse updateBillingPeriod(
            Long billingPeriodId,
            PatchBillingPeriodRequest request,
            Long updatedByUserId
    ) {
        requireRequestBody(request);

        BillingPeriod existingBillingPeriod = getBillingPeriodEntity(billingPeriodId);
        BillingPeriod candidateBillingPeriod = copyBillingPeriod(existingBillingPeriod);

        applyPatch(candidateBillingPeriod, request);
        validateBillingPeriodFields(candidateBillingPeriod);

        if (!Objects.equals(existingBillingPeriod.getName(), candidateBillingPeriod.getName())
                && billingPeriodRepository.existsByNameIgnoreCaseAndIdNot(
                        candidateBillingPeriod.getName(),
                        existingBillingPeriod.getId()
                )) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing period already exists.");
        }

        resolveAcademicMapping(
                candidateBillingPeriod,
                getPatchedAcademicYearId(request.getAcademicYearId(), existingBillingPeriod),
                getPatchedTermId(request.getTermId(), existingBillingPeriod)
        );

        if (!hasBillingPeriodChanges(existingBillingPeriod, candidateBillingPeriod)) {
            return toDetailResponse(existingBillingPeriod);
        }

        copyMutableFields(candidateBillingPeriod, existingBillingPeriod);
        existingBillingPeriod.setUpdatedByUser(resolveUser(updatedByUserId));

        return toDetailResponse(billingPeriodRepository.save(existingBillingPeriod));
    }

    @Transactional
    public BillingPeriodDetailResponse stepBillingPeriodStatus(
            Long billingPeriodId,
            String direction,
            Long updatedByUserId
    ) {
        BillingPeriod billingPeriod = getBillingPeriodEntity(billingPeriodId);
        int currentIndex = BILLING_PERIOD_STATUSES.indexOf(billingPeriod.getStatus());

        if (currentIndex < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing period status is invalid.");
        }

        int nextIndex = switch (normalizeStatusDirection(direction)) {
            case "UP" -> currentIndex + 1;
            case "DOWN" -> currentIndex - 1;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status direction must be up or down.");
        };

        if (nextIndex < 0 || nextIndex >= BILLING_PERIOD_STATUSES.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing period status cannot move further.");
        }

        billingPeriod.setStatus(BILLING_PERIOD_STATUSES.get(nextIndex));
        billingPeriod.setUpdatedByUser(resolveUser(updatedByUserId));

        return toDetailResponse(billingPeriodRepository.save(billingPeriod));
    }

    @Transactional(readOnly = true)
    public List<BillingPeriodRunResponse> listBillingPeriodRuns(Long billingPeriodId) {
        requirePositiveId(billingPeriodId, "Billing period ID");

        if (!billingPeriodRepository.existsById(billingPeriodId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return billingPeriodRunRepository.findByBillingPeriod_IdOrderByCreatedAtDescIdDesc(billingPeriodId)
                .stream()
                .map(this::toRunResponse)
                .toList();
    }

    @Transactional
    public RunBillingPeriodResponse createStubbedBillingRun(
            Long billingPeriodId,
            RunBillingPeriodRequest request,
            Long triggeredByUserId
    ) {
        BillingPeriod billingPeriod = getBillingPeriodEntity(billingPeriodId);
        SisUser triggeredByUser = resolveUser(triggeredByUserId);
        String message = request == null ? null : trimToNull(request.message());

        if (message != null) {
            validateMaxLength(message, 255, "Billing run message");
        }

        BillingPeriodRun run = new BillingPeriodRun();
        run.setBillingPeriod(billingPeriod);
        run.setStatus("QUEUED");
        run.setBillingPeriodStatusAtRun(billingPeriod.getStatus());
        run.setTriggerSource(triggeredByUser == null ? "SYSTEM" : "USER");
        run.setTriggeredByUser(triggeredByUser);
        run.setMessage(message == null ? DEFAULT_RUN_MESSAGE : message);
        run.setCreatedByUser(triggeredByUser);
        run.setUpdatedByUser(triggeredByUser);

        return new RunBillingPeriodResponse(toRunResponse(billingPeriodRunRepository.save(run)));
    }

    private BillingPeriod getBillingPeriodEntity(Long billingPeriodId) {
        requirePositiveId(billingPeriodId, "Billing period ID");

        return billingPeriodRepository.findById(billingPeriodId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private SisUser resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }

        return sisUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found."));
    }

    private void resolveAcademicMapping(BillingPeriod billingPeriod, Long academicYearId, Long termId) {
        AcademicYear academicYear = academicYearId == null ? null : academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year not found."));
        AcademicTerm term = termId == null ? null : academicTermRepository.findById(termId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic term not found."));

        if (term != null && academicYear == null) {
            academicYear = term.getAcademicYear();
        }

        if (academicYear != null && term != null && !Objects.equals(term.getAcademicYear().getId(), academicYear.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic term must belong to the academic year.");
        }

        billingPeriod.setAcademicYear(academicYear);
        billingPeriod.setTerm(term);
    }

    private void applyCreateRequestFields(BillingPeriod billingPeriod, CreateBillingPeriodRequest request) {
        billingPeriod.setStartDate(request.startDate());
        billingPeriod.setEndDate(request.endDate());
        billingPeriod.setActualStartPreliminaryEndDate(request.actualStartPreliminaryEndDate());
        billingPeriod.setTaxAcademicYear(trimToNull(request.taxAcademicYear()));
        billingPeriod.setTaxAcademicYearLabel(trimToNull(request.taxAcademicYearLabel()));
        billingPeriod.setTaxAcademicTermCode(trimToNull(request.taxAcademicTermCode()));
        billingPeriod.setTaxAcademicTermName(trimToNull(request.taxAcademicTermName()));
        billingPeriod.setFinancialAidPeriodCode(trimToNull(request.financialAidPeriodCode()));
        billingPeriod.setFinancialAidPeriodName(trimToNull(request.financialAidPeriodName()));
        billingPeriod.setCourseBillingBasis(normalizeBaseDateBasis(request.courseBillingBasis(), "BILLING_PERIOD_START_DATE"));
        billingPeriod.setNonCourseBillingBasis(normalizeBaseDateBasis(request.nonCourseBillingBasis(), "BILLING_PERIOD_START_DATE"));
        billingPeriod.setActualFromToDays(request.actualFromToDays() == null ? 0 : request.actualFromToDays());
        billingPeriod.setPreliminaryFromToDays(request.preliminaryFromToDays() == null ? 0 : request.preliminaryFromToDays());
        billingPeriod.setActive(request.active() == null || request.active());
        billingPeriod.setAllowReBilling(Boolean.TRUE.equals(request.allowReBilling()));
        billingPeriod.setAllowArBilling(request.allowArBilling() == null || request.allowArBilling());
        billingPeriod.setIncludeInArStatements(Boolean.TRUE.equals(request.includeInArStatements()));
        billingPeriod.setAllowBillingInCampusPortal(Boolean.TRUE.equals(request.allowBillingInCampusPortal()));
        billingPeriod.setRunPrelimInCampusPortalOnly(Boolean.TRUE.equals(request.runPrelimInCampusPortalOnly()));
        billingPeriod.setAcademicRecordsMapped(Boolean.TRUE.equals(request.academicRecordsMapped()));
        billingPeriod.setChildrenAssigned(Boolean.TRUE.equals(request.childrenAssigned()));
    }

    private void applyPatch(BillingPeriod billingPeriod, PatchBillingPeriodRequest request) {
        applyTrimmed(request.getName(), value -> billingPeriod.setName(normalizeName(value)));
        applyTrimmed(request.getDescription(), billingPeriod::setDescription);
        applyTrimmed(request.getType(), value -> billingPeriod.setType(normalizeType(value)));
        applyTrimmed(request.getStatus(), value -> billingPeriod.setStatus(normalizeStatus(value)));
        apply(request.getStartDate(), billingPeriod::setStartDate);
        apply(request.getEndDate(), billingPeriod::setEndDate);
        apply(request.getActualStartPreliminaryEndDate(), billingPeriod::setActualStartPreliminaryEndDate);
        applyTrimmed(request.getTaxAcademicYear(), billingPeriod::setTaxAcademicYear);
        applyTrimmed(request.getTaxAcademicYearLabel(), billingPeriod::setTaxAcademicYearLabel);
        applyTrimmed(request.getTaxAcademicTermCode(), billingPeriod::setTaxAcademicTermCode);
        applyTrimmed(request.getTaxAcademicTermName(), billingPeriod::setTaxAcademicTermName);
        applyTrimmed(request.getFinancialAidPeriodCode(), billingPeriod::setFinancialAidPeriodCode);
        applyTrimmed(request.getFinancialAidPeriodName(), billingPeriod::setFinancialAidPeriodName);
        applyTrimmed(request.getCourseBillingBasis(), value -> billingPeriod.setCourseBillingBasis(normalizeBaseDateBasis(value, null)));
        applyTrimmed(request.getNonCourseBillingBasis(), value -> billingPeriod.setNonCourseBillingBasis(normalizeBaseDateBasis(value, null)));
        apply(request.getActualFromToDays(), billingPeriod::setActualFromToDays);
        apply(request.getPreliminaryFromToDays(), billingPeriod::setPreliminaryFromToDays);
        apply(request.getActive(), value -> billingPeriod.setActive(Boolean.TRUE.equals(value)));
        apply(request.getAllowReBilling(), value -> billingPeriod.setAllowReBilling(Boolean.TRUE.equals(value)));
        apply(request.getAllowArBilling(), value -> billingPeriod.setAllowArBilling(Boolean.TRUE.equals(value)));
        apply(request.getIncludeInArStatements(), value -> billingPeriod.setIncludeInArStatements(Boolean.TRUE.equals(value)));
        apply(request.getAllowBillingInCampusPortal(), value -> billingPeriod.setAllowBillingInCampusPortal(Boolean.TRUE.equals(value)));
        apply(request.getRunPrelimInCampusPortalOnly(), value -> billingPeriod.setRunPrelimInCampusPortalOnly(Boolean.TRUE.equals(value)));
        apply(request.getAcademicRecordsMapped(), value -> billingPeriod.setAcademicRecordsMapped(Boolean.TRUE.equals(value)));
        apply(request.getChildrenAssigned(), value -> billingPeriod.setChildrenAssigned(Boolean.TRUE.equals(value)));
    }

    private void validateBillingPeriodFields(BillingPeriod billingPeriod) {
        if (billingPeriod.getName() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing period name is required.");
        }

        if (billingPeriod.getDescription() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing period description is required.");
        }

        validateMaxLength(billingPeriod.getName(), 64, "Billing period name");
        validateMaxLength(billingPeriod.getDescription(), 255, "Billing period description");
        validateMaxLength(billingPeriod.getTaxAcademicYear(), 32, "1098-T academic year");
        validateMaxLength(billingPeriod.getTaxAcademicYearLabel(), 64, "1098-T academic year label");
        validateMaxLength(billingPeriod.getTaxAcademicTermCode(), 32, "1098-T academic term code");
        validateMaxLength(billingPeriod.getTaxAcademicTermName(), 128, "1098-T academic term name");
        validateMaxLength(billingPeriod.getFinancialAidPeriodCode(), 64, "Financial aid period code");
        validateMaxLength(billingPeriod.getFinancialAidPeriodName(), 128, "Financial aid period name");

        requireMember(billingPeriod.getType(), BILLING_PERIOD_TYPES, "Billing period type");
        requireMember(billingPeriod.getStatus(), Set.copyOf(BILLING_PERIOD_STATUSES), "Billing period status");
        requireMember(billingPeriod.getCourseBillingBasis(), BILLING_BASE_DATE_BASES, "Course billing basis");
        requireMember(billingPeriod.getNonCourseBillingBasis(), BILLING_BASE_DATE_BASES, "Non-course billing basis");

        if (billingPeriod.getStartDate() != null
                && billingPeriod.getEndDate() != null
                && billingPeriod.getStartDate().isAfter(billingPeriod.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date must be before or equal to end date.");
        }

        if (billingPeriod.getActualFromToDays() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Actual from/to days is required.");
        }

        if (billingPeriod.getPreliminaryFromToDays() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preliminary from/to days is required.");
        }
    }

    private void requireMember(String value, Set<String> allowedValues, String fieldName) {
        if (value == null || !allowedValues.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is invalid.");
        }
    }

    private Sort buildBillingPeriodSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String sortProperty = switch (normalizeSortBy(sortBy, "name")) {
            case "name" -> "name";
            case "description" -> "description";
            case "status" -> "status";
            case "startDate" -> "startDate";
            case "endDate" -> "endDate";
            case "updatedAt" -> "updatedAt";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: name, description, status, startDate, endDate, updatedAt."
            );
        };

        return Sort.by(direction, sortProperty)
                .and(Sort.by(Sort.Direction.ASC, "name"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private String normalizeName(String name) {
        String trimmedName = trimToNull(name);
        return trimmedName == null ? null : trimmedName.toUpperCase(Locale.US);
    }

    private String normalizeType(String type) {
        return normalizeEnum(type);
    }

    private String normalizeStatus(String status) {
        return normalizeEnum(status);
    }

    private String normalizeOptionalStatus(String value) {
        String trimmedValue = trimToNull(value);
        if (trimmedValue == null) {
            return null;
        }

        String normalizedStatus = normalizeStatus(trimmedValue);
        requireMember(normalizedStatus, Set.copyOf(BILLING_PERIOD_STATUSES), "Billing period status");
        return normalizedStatus.toLowerCase(Locale.US);
    }

    private String normalizeBaseDateBasis(String value, String defaultValue) {
        String trimmedValue = trimToNull(value);
        return trimmedValue == null && defaultValue != null ? defaultValue : normalizeEnum(trimmedValue);
    }

    private String normalizeEnum(String value) {
        String trimmedValue = trimToNull(value);
        return trimmedValue == null ? null : trimmedValue.replaceAll("[\\s-]+", "_").toUpperCase(Locale.US);
    }

    private String normalizeStatusDirection(String direction) {
        String normalizedDirection = normalizeEnum(direction);
        return switch (normalizedDirection) {
            case "UP", "NEXT", "FORWARD" -> "UP";
            case "DOWN", "PREVIOUS", "BACK" -> "DOWN";
            default -> normalizedDirection;
        };
    }

    private String toLikePattern(String value) {
        String trimmedValue = trimToNull(value);
        return trimmedValue == null ? null : "%" + trimmedValue.toLowerCase(Locale.US) + "%";
    }

    private Long getPatchedAcademicYearId(PatchValue<Long> patchValue, BillingPeriod existingBillingPeriod) {
        return patchValue.isPresent()
                ? patchValue.getValue()
                : existingBillingPeriod.getAcademicYear() == null ? null : existingBillingPeriod.getAcademicYear().getId();
    }

    private Long getPatchedTermId(PatchValue<Long> patchValue, BillingPeriod existingBillingPeriod) {
        return patchValue.isPresent()
                ? patchValue.getValue()
                : existingBillingPeriod.getTerm() == null ? null : existingBillingPeriod.getTerm().getId();
    }

    private BillingPeriod copyBillingPeriod(BillingPeriod billingPeriod) {
        BillingPeriod copy = new BillingPeriod();
        copy.setId(billingPeriod.getId());
        copyMutableFields(billingPeriod, copy);
        return copy;
    }

    private void copyMutableFields(BillingPeriod source, BillingPeriod target) {
        target.setName(source.getName());
        target.setDescription(source.getDescription());
        target.setType(source.getType());
        target.setStatus(source.getStatus());
        target.setAcademicYear(source.getAcademicYear());
        target.setTerm(source.getTerm());
        target.setStartDate(source.getStartDate());
        target.setEndDate(source.getEndDate());
        target.setActualStartPreliminaryEndDate(source.getActualStartPreliminaryEndDate());
        target.setTaxAcademicYear(source.getTaxAcademicYear());
        target.setTaxAcademicYearLabel(source.getTaxAcademicYearLabel());
        target.setTaxAcademicTermCode(source.getTaxAcademicTermCode());
        target.setTaxAcademicTermName(source.getTaxAcademicTermName());
        target.setFinancialAidPeriodCode(source.getFinancialAidPeriodCode());
        target.setFinancialAidPeriodName(source.getFinancialAidPeriodName());
        target.setCourseBillingBasis(source.getCourseBillingBasis());
        target.setNonCourseBillingBasis(source.getNonCourseBillingBasis());
        target.setActualFromToDays(source.getActualFromToDays());
        target.setPreliminaryFromToDays(source.getPreliminaryFromToDays());
        target.setActive(source.isActive());
        target.setAllowReBilling(source.isAllowReBilling());
        target.setAllowArBilling(source.isAllowArBilling());
        target.setIncludeInArStatements(source.isIncludeInArStatements());
        target.setAllowBillingInCampusPortal(source.isAllowBillingInCampusPortal());
        target.setRunPrelimInCampusPortalOnly(source.isRunPrelimInCampusPortalOnly());
        target.setAcademicRecordsMapped(source.isAcademicRecordsMapped());
        target.setChildrenAssigned(source.isChildrenAssigned());
    }

    private boolean hasBillingPeriodChanges(BillingPeriod existing, BillingPeriod candidate) {
        return !Objects.equals(existing.getName(), candidate.getName())
                || !Objects.equals(existing.getDescription(), candidate.getDescription())
                || !Objects.equals(existing.getType(), candidate.getType())
                || !Objects.equals(existing.getStatus(), candidate.getStatus())
                || !Objects.equals(getAcademicYearId(existing), getAcademicYearId(candidate))
                || !Objects.equals(getTermId(existing), getTermId(candidate))
                || !Objects.equals(existing.getStartDate(), candidate.getStartDate())
                || !Objects.equals(existing.getEndDate(), candidate.getEndDate())
                || !Objects.equals(existing.getActualStartPreliminaryEndDate(), candidate.getActualStartPreliminaryEndDate())
                || !Objects.equals(existing.getTaxAcademicYear(), candidate.getTaxAcademicYear())
                || !Objects.equals(existing.getTaxAcademicYearLabel(), candidate.getTaxAcademicYearLabel())
                || !Objects.equals(existing.getTaxAcademicTermCode(), candidate.getTaxAcademicTermCode())
                || !Objects.equals(existing.getTaxAcademicTermName(), candidate.getTaxAcademicTermName())
                || !Objects.equals(existing.getFinancialAidPeriodCode(), candidate.getFinancialAidPeriodCode())
                || !Objects.equals(existing.getFinancialAidPeriodName(), candidate.getFinancialAidPeriodName())
                || !Objects.equals(existing.getCourseBillingBasis(), candidate.getCourseBillingBasis())
                || !Objects.equals(existing.getNonCourseBillingBasis(), candidate.getNonCourseBillingBasis())
                || !Objects.equals(existing.getActualFromToDays(), candidate.getActualFromToDays())
                || !Objects.equals(existing.getPreliminaryFromToDays(), candidate.getPreliminaryFromToDays())
                || existing.isActive() != candidate.isActive()
                || existing.isAllowReBilling() != candidate.isAllowReBilling()
                || existing.isAllowArBilling() != candidate.isAllowArBilling()
                || existing.isIncludeInArStatements() != candidate.isIncludeInArStatements()
                || existing.isAllowBillingInCampusPortal() != candidate.isAllowBillingInCampusPortal()
                || existing.isRunPrelimInCampusPortalOnly() != candidate.isRunPrelimInCampusPortalOnly()
                || existing.isAcademicRecordsMapped() != candidate.isAcademicRecordsMapped()
                || existing.isChildrenAssigned() != candidate.isChildrenAssigned();
    }

    private Long getAcademicYearId(BillingPeriod billingPeriod) {
        return billingPeriod.getAcademicYear() == null ? null : billingPeriod.getAcademicYear().getId();
    }

    private Long getTermId(BillingPeriod billingPeriod) {
        return billingPeriod.getTerm() == null ? null : billingPeriod.getTerm().getId();
    }

    private BillingPeriodSearchResultResponse toSearchResultResponse(BillingPeriod billingPeriod) {
        AcademicYear academicYear = billingPeriod.getAcademicYear();
        AcademicTerm term = billingPeriod.getTerm();

        return new BillingPeriodSearchResultResponse(
                billingPeriod.getId(),
                billingPeriod.getName(),
                billingPeriod.getDescription(),
                billingPeriod.getType(),
                billingPeriod.getStatus(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                billingPeriod.getStartDate(),
                billingPeriod.getEndDate(),
                billingPeriod.getTaxAcademicTermCode(),
                billingPeriod.getTaxAcademicTermName(),
                billingPeriod.getFinancialAidPeriodCode(),
                billingPeriod.getFinancialAidPeriodName(),
                billingPeriod.isActive()
        );
    }

    private BillingPeriodDetailResponse toDetailResponse(BillingPeriod billingPeriod) {
        AcademicYear academicYear = billingPeriod.getAcademicYear();
        AcademicTerm term = billingPeriod.getTerm();
        SisUser createdByUser = billingPeriod.getCreatedByUser();
        SisUser updatedByUser = billingPeriod.getUpdatedByUser();

        return new BillingPeriodDetailResponse(
                billingPeriod.getId(),
                billingPeriod.getName(),
                billingPeriod.getDescription(),
                billingPeriod.getType(),
                billingPeriod.getStatus(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                billingPeriod.getStartDate(),
                billingPeriod.getEndDate(),
                billingPeriod.getActualStartPreliminaryEndDate(),
                billingPeriod.getTaxAcademicYear(),
                billingPeriod.getTaxAcademicYearLabel(),
                billingPeriod.getTaxAcademicTermCode(),
                billingPeriod.getTaxAcademicTermName(),
                billingPeriod.getFinancialAidPeriodCode(),
                billingPeriod.getFinancialAidPeriodName(),
                billingPeriod.getCourseBillingBasis(),
                billingPeriod.getNonCourseBillingBasis(),
                billingPeriod.getActualFromToDays(),
                billingPeriod.getPreliminaryFromToDays(),
                billingPeriod.isActive(),
                billingPeriod.isAllowReBilling(),
                billingPeriod.isAllowArBilling(),
                billingPeriod.isIncludeInArStatements(),
                billingPeriod.isAllowBillingInCampusPortal(),
                billingPeriod.isRunPrelimInCampusPortalOnly(),
                billingPeriod.isAcademicRecordsMapped(),
                billingPeriod.isChildrenAssigned(),
                createdByUser == null ? null : createdByUser.getId(),
                createdByUser == null ? null : createdByUser.getEmail(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail(),
                billingPeriod.getCreatedAt(),
                billingPeriod.getUpdatedAt()
        );
    }

    private BillingPeriodRunResponse toRunResponse(BillingPeriodRun run) {
        BillingPeriod billingPeriod = run.getBillingPeriod();
        SisUser triggeredByUser = run.getTriggeredByUser();
        SisUser createdByUser = run.getCreatedByUser();
        SisUser updatedByUser = run.getUpdatedByUser();

        return new BillingPeriodRunResponse(
                run.getId(),
                billingPeriod == null ? null : billingPeriod.getId(),
                run.getStatus(),
                run.getBillingPeriodStatusAtRun(),
                run.getStartedAt(),
                run.getCompletedAt(),
                run.getTriggerSource(),
                triggeredByUser == null ? null : triggeredByUser.getId(),
                triggeredByUser == null ? null : triggeredByUser.getEmail(),
                run.getMessage(),
                createdByUser == null ? null : createdByUser.getId(),
                createdByUser == null ? null : createdByUser.getEmail(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail(),
                run.getCreatedAt(),
                run.getUpdatedAt()
        );
    }
}
