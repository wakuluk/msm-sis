package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.school.AcademicSchoolDepartmentSearchCriteria;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static com.msm.sis.api.util.ValidationUtils.requireGreaterThanZero;

@Service
public class AcademicSchoolValidationService {

    public void validateSearchCriteria(AcademicSchoolDepartmentSearchCriteria criteria) {
        if (criteria == null) {
            return;
        }

        if (criteria.getSchoolId() != null) {
            requireGreaterThanZero(criteria.getSchoolId(), "School ID");
        }

        if (criteria.getDepartmentId() != null) {
            requireGreaterThanZero(criteria.getDepartmentId(), "Department ID");
        }

        normalizeSearchSortBy(criteria.getSortBy());
        parseSearchSortDirection(criteria.getSortDirection());
    }

    public String normalizeSearchSortBy(String sortBy) {
        return switch (sortBy == null || sortBy.isBlank() ? "schoolName" : sortBy.trim()) {
            case "schoolCode", "schoolName", "schoolActive", "departmentCode", "departmentName", "departmentActive" ->
                    sortBy == null || sortBy.isBlank() ? "schoolName" : sortBy.trim();
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: schoolCode, schoolName, schoolActive, departmentCode, departmentName, departmentActive."
            );
        };
    }

    public Sort.Direction parseSearchSortDirection(String sortDirection) {
        if (sortDirection == null || sortDirection.isBlank()) {
            return Sort.Direction.ASC;
        }

        try {
            return Sort.Direction.fromString(sortDirection.trim());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }
}
