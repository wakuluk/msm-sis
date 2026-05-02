package com.msm.sis.api.util;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class SortUtils {

    private SortUtils() {
    }

    public static Sort.Direction parseDirection(String sortDirection, Sort.Direction defaultDirection) {
        try {
            return Sort.Direction.fromString(sortDirection == null ? defaultDirection.name() : sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }
}
