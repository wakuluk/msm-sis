package com.msm.sis.api.util;

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
}
