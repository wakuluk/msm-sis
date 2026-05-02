package com.msm.sis.api.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ValidationUtils {
    private ValidationUtils() {
    }

    public static <T> T requireRequestBody(T request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        return request;
    }

    public static Long requirePositiveId(Long id, String label) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be a positive number.");
        }

        return id;
    }

    public static Long requireGreaterThanZero(Long value, String label) {
        if (value == null || value <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be greater than zero.");
        }

        return value;
    }

    public static void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value != null && value.length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must be " + maxLength + " characters or fewer."
            );
        }
    }
}
