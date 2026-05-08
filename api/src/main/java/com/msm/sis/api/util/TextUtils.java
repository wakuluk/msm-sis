package com.msm.sis.api.util;

import java.util.Locale;

public final class TextUtils {

    private TextUtils() {
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    public static boolean containsIgnoreCase(String value, String filter) {
        String normalizedFilter = trimToNull(filter);

        if (normalizedFilter == null) {
            return true;
        }

        if (value == null) {
            return false;
        }

        return value.toLowerCase(Locale.ROOT).contains(normalizedFilter.toLowerCase(Locale.ROOT));
    }

    public static String normalizeSortBy(String sortBy, String defaultSortBy) {
        String normalizedSortBy = trimToNull(sortBy);
        return normalizedSortBy == null ? defaultSortBy : normalizedSortBy;
    }
}
