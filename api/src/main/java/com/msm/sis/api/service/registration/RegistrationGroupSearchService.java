package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupSearchCriteria;
import com.msm.sis.api.dto.registration.RegistrationGroupSearchPageResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupSearchResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupSearchResultResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupGeneration;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class RegistrationGroupSearchService {
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 25;
    private static final int MAX_PAGE_SIZE = 100;

    private final RegistrationGroupLifecycleService lifecycleService;
    private final RegistrationGroupRepository registrationGroupRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;

    @Transactional(readOnly = true)
    public RegistrationGroupSearchResponse searchRegistrationGroups(RegistrationGroupSearchCriteria criteria) {
        RegistrationGroupSearchCriteria effectiveCriteria =
                criteria == null ? new RegistrationGroupSearchCriteria() : criteria;
        int page = effectiveCriteria.getPage() == null ? DEFAULT_PAGE : effectiveCriteria.getPage();
        int size = effectiveCriteria.getSize() == null ? DEFAULT_SIZE : effectiveCriteria.getSize();
        validatePageRequest(page, size, MAX_PAGE_SIZE);
        lifecycleService.closeExpiredPublishedGroups();

        List<RegistrationGroup> matchingGroups = registrationGroupRepository.searchRegistrationGroups(
                normalizeId(effectiveCriteria.getAcademicYearId(), "Academic year id"),
                normalizeId(effectiveCriteria.getTermId(), "Term id"),
                normalizeStatus(effectiveCriteria.getStatus()),
                normalizeSearchQuery(effectiveCriteria.getGroupQuery())
        );
        Map<Long, Long> studentCountsByGroupId = findStudentCountsByGroupId(matchingGroups);
        List<RegistrationGroupSearchResultResponse> sortedResults = matchingGroups.stream()
                .map(registrationGroup -> toResultResponse(
                        registrationGroup,
                        studentCountsByGroupId.getOrDefault(registrationGroup.getId(), 0L)
                ))
                .sorted(buildComparator(effectiveCriteria.getSortBy(), effectiveCriteria.getSortDirection()))
                .toList();

        long totalElements = sortedResults.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, sortedResults.size());
        int toIndex = Math.min(fromIndex + size, sortedResults.size());

        return new RegistrationGroupSearchResponse(
                new RegistrationGroupSearchPageResponse(page, size, totalElements, totalPages),
                sortedResults.subList(fromIndex, toIndex)
        );
    }

    private Map<Long, Long> findStudentCountsByGroupId(List<RegistrationGroup> registrationGroups) {
        List<Long> registrationGroupIds = registrationGroups.stream()
                .map(RegistrationGroup::getId)
                .toList();

        if (registrationGroupIds.isEmpty()) {
            return Map.of();
        }

        return registrationGroupStudentRepository.countStudentsByRegistrationGroupIds(registrationGroupIds).stream()
                .collect(Collectors.toMap(
                        RegistrationGroupStudentRepository.RegistrationGroupStudentCountProjection::getRegistrationGroupId,
                        RegistrationGroupStudentRepository.RegistrationGroupStudentCountProjection::getStudentCount
                ));
    }

    private Comparator<RegistrationGroupSearchResultResponse> buildComparator(
            String sortBy,
            String sortDirection
    ) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String normalizedSortBy = normalizeSortBy(sortBy, "name");

        Comparator<RegistrationGroupSearchResultResponse> comparator = switch (normalizedSortBy) {
            case "academicYear" -> Comparator
                    .comparing(RegistrationGroupSearchResultResponse::academicYearName, nullSafeStringComparator())
                    .thenComparing(RegistrationGroupSearchResultResponse::academicYearCode, nullSafeStringComparator())
                    .thenComparing(RegistrationGroupSearchResultResponse::name, nullSafeStringComparator());
            case "name" -> Comparator
                    .comparing(RegistrationGroupSearchResultResponse::name, nullSafeStringComparator())
                    .thenComparing(RegistrationGroupSearchResultResponse::academicYearName, nullSafeStringComparator())
                    .thenComparing(RegistrationGroupSearchResultResponse::termName, nullSafeStringComparator());
            case "registrationOpensAt" -> Comparator
                    .comparing(RegistrationGroupSearchResultResponse::registrationOpensAt, nullSafeDateTimeComparator())
                    .thenComparing(RegistrationGroupSearchResultResponse::name, nullSafeStringComparator());
            case "status" -> Comparator
                    .comparing(RegistrationGroupSearchResultResponse::statusName, nullSafeStringComparator())
                    .thenComparing(RegistrationGroupSearchResultResponse::name, nullSafeStringComparator());
            case "studentCount" -> Comparator
                    .comparingLong(RegistrationGroupSearchResultResponse::studentCount)
                    .thenComparing(RegistrationGroupSearchResultResponse::name, nullSafeStringComparator());
            case "term" -> Comparator
                    .comparing(RegistrationGroupSearchResultResponse::termName, nullSafeStringComparator())
                    .thenComparing(RegistrationGroupSearchResultResponse::name, nullSafeStringComparator());
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: academicYear, name, registrationOpensAt, status, studentCount, term."
            );
        };

        if (direction.isDescending()) {
            comparator = comparator.reversed();
        }

        return comparator.thenComparing(RegistrationGroupSearchResultResponse::registrationGroupId);
    }

    private Comparator<String> nullSafeStringComparator() {
        return Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
    }

    private Comparator<LocalDateTime> nullSafeDateTimeComparator() {
        return Comparator.nullsLast(LocalDateTime::compareTo);
    }

    private RegistrationGroupSearchResultResponse toResultResponse(
            RegistrationGroup registrationGroup,
            long studentCount
    ) {
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        RegistrationGroupGeneration generation = registrationGroup.getRegistrationGroupGeneration();
        String normalizedStatus = normalizeStatusCode(registrationGroup.getStatus());

        return new RegistrationGroupSearchResultResponse(
                registrationGroup.getId(),
                registrationGroup.getName(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                normalizedStatus,
                toStatusName(normalizedStatus),
                registrationGroup.getRegistrationOpensAt(),
                registrationGroup.getRegistrationClosesAt(),
                generation == null ? null : generation.getId(),
                generation == null ? null : generation.getName(),
                generation == null ? null : generation.getName(),
                studentCount
        );
    }

    private Long normalizeId(Long id, String label) {
        return id == null ? null : requirePositiveId(id, label);
    }

    private String normalizeSearchQuery(String value) {
        String trimmedValue = trimToNull(value);
        return trimmedValue == null ? null : "%" + trimmedValue.toLowerCase(Locale.ROOT) + "%";
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = normalizeStatusCode(status);
        if (normalizedStatus == null || "ALL".equals(normalizedStatus)) {
            return null;
        }

        validateStatus(normalizedStatus);
        return normalizedStatus;
    }

    private String normalizeStatusCode(String status) {
        String trimmedStatus = trimToNull(status);
        return trimmedStatus == null ? null : trimmedStatus.toUpperCase(Locale.ROOT);
    }

    private void validateStatus(String status) {
        if (!RegistrationGroupStatusSupport.isAllowedStatus(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    RegistrationGroupStatusSupport.ALLOWED_STATUS_MESSAGE
            );
        }
    }

    private String toStatusName(String status) {
        return RegistrationGroupStatusSupport.statusName(status);
    }
}
