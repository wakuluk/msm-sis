package com.msm.sis.api.validation;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ValidationUtils {

    private ValidationUtils() {
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
