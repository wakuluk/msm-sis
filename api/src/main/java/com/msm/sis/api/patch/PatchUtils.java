package com.msm.sis.api.patch;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.function.Consumer;

import static com.msm.sis.api.util.TextUtils.trimToNull;

public final class PatchUtils {

    private PatchUtils() {
    }

    public static <T> void apply(PatchValue<T> value, Consumer<T> consumer) {
        if (value.isPresent()) {
            consumer.accept(value.orElse(null));
        }
    }

    public static void applyTrimmed(PatchValue<String> value, Consumer<String> consumer) {
        apply(value, currentValue -> consumer.accept(trimToNull(currentValue)));
    }

    public static void applyRequiredBoolean(
            PatchValue<Boolean> value,
            Consumer<Boolean> consumer,
            String fieldName
    ) {
        if (!value.isPresent()) {
            return;
        }

        Boolean patchedValue = value.orElse(null);
        if (patchedValue == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }

        consumer.accept(patchedValue);
    }
}
