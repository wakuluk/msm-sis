package com.msm.sis.api.dto.student;

import org.springframework.data.domain.Sort;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum StudentSearchSortField {
    STUDENT_ID("studentId", "id"),
    FIRST_NAME("firstName", "firstName"),
    LAST_NAME("lastName", "lastName"),
    CLASS_OF("classOf", "estimatedGradDate"),
    CLASS_STANDING("classStanding", "classStanding.name"),
    ADDRESS_LINE_1("addressLine1", "address.addressLine1"),
    ADDRESS_LINE_2("addressLine2", "address.addressLine2"),
    CITY("city", "address.city"),
    STATE_REGION("stateRegion", "address.stateRegion"),
    POSTAL_CODE("postalCode", "address.postalCode"),
    COUNTRY_CODE("countryCode", "address.countryCode"),
    DISABLED("disabled", "disabled"),
    LAST_UPDATED("lastUpdated", "lastUpdated"),
    UPDATED_BY("updatedBy", "updatedBy");

    private static final Map<String, StudentSearchSortField> BY_REQUEST_VALUE = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(StudentSearchSortField::getRequestValue, Function.identity()));

    private final String requestValue;
    private final String propertyPath;

    StudentSearchSortField(String requestValue, String propertyPath) {
        this.requestValue = requestValue;
        this.propertyPath = propertyPath;
    }

    public static StudentSearchSortField fromRequestValue(String value) {
        if (value == null || value.isBlank()) {
            return LAST_NAME;
        }

        StudentSearchSortField sortField = BY_REQUEST_VALUE.get(value.trim());

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
