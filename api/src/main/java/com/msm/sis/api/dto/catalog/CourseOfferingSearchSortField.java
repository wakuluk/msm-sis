package com.msm.sis.api.dto.catalog;

import org.springframework.data.domain.Sort;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum CourseOfferingSearchSortField {
    ACADEMIC_YEAR_CODE("academicYearCode", "term.academicYear.code"),
    TERM_CODE("termCode", "term.sortOrder"),
    DEPARTMENT_CODE("departmentCode", "courseVersion.course.subject.department.code"),
    SUBJECT_CODE("subjectCode", "courseVersion.course.subject.code"),
    COURSE_NUMBER("courseNumber", "courseVersion.course.courseNumber"),
    COURSE_CODE("courseCode", "courseVersion.course.subject.code", "courseVersion.course.courseNumber"),
    TITLE("title", "courseVersion.title"),
    MIN_CREDITS("minCredits", "courseVersion.minCredits"),
    MAX_CREDITS("maxCredits", "courseVersion.maxCredits"),
    VARIABLE_CREDIT("variableCredit", "courseVersion.variableCredit"),
    OFFERING_STATUS_CODE("offeringStatusCode", "status.code");

    private static final Map<String, CourseOfferingSearchSortField> BY_REQUEST_VALUE = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(CourseOfferingSearchSortField::getRequestValue, Function.identity()));

    private final String requestValue;
    private final String[] propertyPaths;

    CourseOfferingSearchSortField(String requestValue, String... propertyPaths) {
        this.requestValue = requestValue;
        this.propertyPaths = propertyPaths;
    }

    public static CourseOfferingSearchSortField fromRequestValue(String value) {
        if (value == null || value.isBlank()) {
            return TERM_CODE;
        }

        CourseOfferingSearchSortField sortField = BY_REQUEST_VALUE.get(value.trim());

        if (sortField == null) {
            throw new IllegalArgumentException("Unsupported sort field: " + value);
        }

        return sortField;
    }

    public String getRequestValue() {
        return requestValue;
    }

    public Sort toSort(Sort.Direction direction) {
        return Sort.by(direction, propertyPaths);
    }
}
