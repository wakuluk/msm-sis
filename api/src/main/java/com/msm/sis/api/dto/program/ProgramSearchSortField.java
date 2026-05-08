package com.msm.sis.api.dto.program;

import org.springframework.data.domain.Sort;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum ProgramSearchSortField {
    PROGRAM_TYPE_NAME("programTypeName", "programType.name"),
    DEGREE_TYPE_NAME("degreeTypeName", "degreeType.name"),
    SCHOOL_NAME("schoolName", "school.name"),
    DEPARTMENT_NAME("departmentName", "department.name"),
    CODE("code", "code"),
    NAME("name", "name"),
    CREATED_AT("createdAt", "createdAt"),
    UPDATED_AT("updatedAt", "updatedAt");

    private static final Map<String, ProgramSearchSortField> BY_REQUEST_VALUE = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(ProgramSearchSortField::getRequestValue, Function.identity()));

    private final String requestValue;
    private final String propertyPath;

    ProgramSearchSortField(String requestValue, String propertyPath) {
        this.requestValue = requestValue;
        this.propertyPath = propertyPath;
    }

    public static ProgramSearchSortField fromRequestValue(String value) {
        if (value == null || value.isBlank()) {
            return CODE;
        }

        ProgramSearchSortField sortField = BY_REQUEST_VALUE.get(value.trim());

        if (sortField == null) {
            throw new IllegalArgumentException("Unsupported sort field: " + value);
        }

        return sortField;
    }

    public String getRequestValue() {
        return requestValue;
    }

    public Sort toSort(Sort.Direction direction) {
        return Sort.by(direction, propertyPath);
    }
}
