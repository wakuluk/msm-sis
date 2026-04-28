package com.msm.sis.api.service.transcript;

public record TranscriptRepeatCode(String code) {

    private static final String REPEATED = "REPEATED";
    private static final String REPLACED = "REPLACED";

    public static TranscriptRepeatCode fromCode(String code) {
        String normalizedCode = normalize(code);
        return new TranscriptRepeatCode(normalizedCode.isBlank() ? null : normalizedCode);
    }

    public static TranscriptRepeatCode repeated() {
        return new TranscriptRepeatCode(REPEATED);
    }

    public static TranscriptRepeatCode replaced() {
        return new TranscriptRepeatCode(REPLACED);
    }

    public boolean isReplaced() {
        return REPLACED.equals(code);
    }

    public String defaultName() {
        if (REPEATED.equals(code)) {
            return "Repeated";
        }
        if (REPLACED.equals(code)) {
            return "Excluded from GPA";
        }
        return null;
    }

    private static String normalize(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }
}
