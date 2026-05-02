package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.year.AcademicYearSearchCriteria;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.trimToNull;

final class AcademicYearSearchSort {
    private AcademicYearSearchSort() {
    }

    static Sort build(AcademicYearSearchCriteria criteria) {
        String sortBy = trimToNull(criteria.getSortBy());
        Sort.Direction sortDirection = parseDirection(criteria.getSortDirection(), Sort.Direction.DESC);

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
}
