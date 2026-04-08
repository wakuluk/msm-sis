package com.msm.sis.api.patch;

import tools.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(using = PatchValueDeserializer.class)
public final class PatchValue<T> {

    // Shared singleton for the common "field was omitted from the PATCH body" state.
    private static final PatchValue<?> ABSENT = new PatchValue<>(false, null);

    private final boolean present;
    private final T value;

    private PatchValue(boolean present, T value) {
        this.present = present;
        this.value = value;
    }

    @SuppressWarnings("unchecked")
    public static <T> PatchValue<T> absent() {
        return (PatchValue<T>) ABSENT;
    }

    // Used when the JSON property is present, including the case where the value is explicitly null.
    public static <T> PatchValue<T> of(T value) {
        return new PatchValue<>(true, value);
    }

    public boolean isPresent() {
        return present;
    }

    public T getValue() {
        return value;
    }

    public T orElse(T fallback) {
        return present ? value : fallback;
    }
}
