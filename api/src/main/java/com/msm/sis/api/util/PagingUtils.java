package com.msm.sis.api.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class PagingUtils {

    private PagingUtils() {
    }

    public static void validatePageRequest(int page, int size, int maxSize) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > maxSize) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Size must be between 1 and " + maxSize + "."
            );
        }
    }
}
