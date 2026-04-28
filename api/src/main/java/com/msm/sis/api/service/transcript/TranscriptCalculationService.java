package com.msm.sis.api.service.transcript;

import com.msm.sis.api.dto.student.transcript.StudentTranscriptCourseResponse;
import com.msm.sis.api.dto.student.transcript.StudentTranscriptSummaryResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TranscriptCalculationService {

    private static final BigDecimal TRANSCRIPT_DECIMAL_ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal GPA_ZERO = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

    public List<CalculatedTranscriptCourseRow> calculateRows(List<RawTranscriptCourseRow> rawRows) {
        Map<CourseAttemptKey, RepeatDecision> repeatDecisions = calculateRepeatDecisions(rawRows);

        return rawRows.stream()
                .map(row -> calculateRow(row, repeatDecisions.get(CourseAttemptKey.from(row))))
                .toList();
    }

    public StudentTranscriptSummaryResponse summarize(List<CalculatedTranscriptCourseRow> rows) {
        BigDecimal attemptedCredits = TRANSCRIPT_DECIMAL_ZERO;
        BigDecimal earnedCredits = TRANSCRIPT_DECIMAL_ZERO;
        BigDecimal gpaCredits = TRANSCRIPT_DECIMAL_ZERO;
        BigDecimal qualityPoints = TRANSCRIPT_DECIMAL_ZERO;

        for (CalculatedTranscriptCourseRow row : rows) {
            attemptedCredits = attemptedCredits.add(row.attemptedCredits());
            earnedCredits = earnedCredits.add(row.earnedCredits());
            gpaCredits = gpaCredits.add(row.gpaCredits());
            qualityPoints = qualityPoints.add(row.qualityPoints());
        }

        return new StudentTranscriptSummaryResponse(
                scaleTranscriptDecimal(attemptedCredits),
                scaleTranscriptDecimal(earnedCredits),
                scaleTranscriptDecimal(gpaCredits),
                scaleTranscriptDecimal(qualityPoints),
                gpa(qualityPoints, gpaCredits)
        );
    }

    private Map<CourseAttemptKey, RepeatDecision> calculateRepeatDecisions(List<RawTranscriptCourseRow> rawRows) {
        Map<CourseKey, List<RawTranscriptCourseRow>> completedAttemptsByCourse = new HashMap<>();
        for (RawTranscriptCourseRow row : rawRows) {
            if (row.transfer() || !row.completed()) {
                continue;
            }
            completedAttemptsByCourse
                    .computeIfAbsent(CourseKey.from(row), ignored -> new ArrayList<>())
                    .add(row);
        }

        Map<CourseAttemptKey, RepeatDecision> repeatDecisions = new HashMap<>();
        for (List<RawTranscriptCourseRow> attempts : completedAttemptsByCourse.values()) {
            if (attempts.size() < 2) {
                continue;
            }

            attempts.sort(Comparator
                    .comparing(RawTranscriptCourseRow::termSortDate, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(RawTranscriptCourseRow::recordId, Comparator.nullsLast(Comparator.naturalOrder()))
                    .reversed());

            for (int index = 0; index < attempts.size(); index++) {
                RawTranscriptCourseRow row = attempts.get(index);
                repeatDecisions.put(
                        CourseAttemptKey.from(row),
                        index == 0
                                ? new RepeatDecision(TranscriptRepeatCode.repeated())
                                : new RepeatDecision(TranscriptRepeatCode.replaced())
                );
            }
        }

        return repeatDecisions;
    }

    private CalculatedTranscriptCourseRow calculateRow(RawTranscriptCourseRow row, RepeatDecision repeatDecision) {
        BigDecimal attemptedCredits = scaleTranscriptDecimal(row.attemptedCredits());
        BigDecimal earnedCredits = calculateEarnedCredits(row, attemptedCredits);
        TranscriptRepeatCode repeatCode = resolveRepeatCode(row, repeatDecision);
        String repeatName = resolveRepeatName(repeatCode, row.repeatName(), repeatDecision);
        BigDecimal gpaCredits = calculateGpaCredits(row, repeatCode, attemptedCredits);
        BigDecimal qualityPoints = calculateQualityPoints(gpaCredits, row.qualityPointsPerCredit());
        String gradeCode = resolveGradeCode(row, earnedCredits);
        String courseCode = String.join(" ", List.of(nullToBlank(row.subjectCode()), nullToBlank(row.courseNumber()))).trim();

        StudentTranscriptCourseResponse response = new StudentTranscriptCourseResponse(
                row.recordId(),
                row.sourceCode(),
                courseCode,
                row.title(),
                row.statusCode(),
                row.statusName(),
                repeatCode.code(),
                repeatName,
                gradeCode,
                row.gradeTypeCode(),
                attemptedCredits,
                earnedCredits,
                gpaCredits,
                qualityPoints
        );

        return new CalculatedTranscriptCourseRow(
                row.termLabel(),
                row.termSortDate(),
                row.sourceCode(),
                row.transfer(),
                courseCode,
                response,
                row.midterm(),
                attemptedCredits,
                earnedCredits,
                gpaCredits,
                qualityPoints
        );
    }

    private BigDecimal calculateEarnedCredits(RawTranscriptCourseRow row, BigDecimal attemptedCredits) {
        if (row.droppedOrWithdrawn()) {
            return TRANSCRIPT_DECIMAL_ZERO;
        }

        if (row.earnedCredits() != null) {
            return scaleTranscriptDecimal(row.earnedCredits());
        }

        return Boolean.TRUE.equals(row.earnsCredit()) ? attemptedCredits : TRANSCRIPT_DECIMAL_ZERO;
    }

    private BigDecimal calculateGpaCredits(RawTranscriptCourseRow row, TranscriptRepeatCode repeatCode, BigDecimal attemptedCredits) {
        if (row.transfer()
                || row.droppedOrWithdrawn()
                || repeatCode.isReplaced()
                || row.passFail()) {
            return TRANSCRIPT_DECIMAL_ZERO;
        }

        if (Boolean.TRUE.equals(row.includeInGpa()) && Boolean.TRUE.equals(row.countsInGpa())) {
            return attemptedCredits;
        }

        return TRANSCRIPT_DECIMAL_ZERO;
    }

    private BigDecimal calculateQualityPoints(BigDecimal gpaCredits, BigDecimal qualityPointsPerCredit) {
        if (gpaCredits.compareTo(BigDecimal.ZERO) == 0) {
            return TRANSCRIPT_DECIMAL_ZERO;
        }

        return scaleTranscriptDecimal(gpaCredits.multiply(scaleTranscriptDecimal(qualityPointsPerCredit)));
    }

    private String resolveGradeCode(RawTranscriptCourseRow row, BigDecimal earnedCredits) {
        if (!row.transfer() || row.gradeCode() != null) {
            return row.gradeCode();
        }

        return earnedCredits.compareTo(BigDecimal.ZERO) > 0 ? "P" : "F";
    }

    private TranscriptRepeatCode resolveRepeatCode(RawTranscriptCourseRow row, RepeatDecision repeatDecision) {
        if (repeatDecision != null) {
            return repeatDecision.code();
        }

        return row.repeatCode();
    }

    private String resolveRepeatName(TranscriptRepeatCode repeatCode, String repeatName, RepeatDecision repeatDecision) {
        if (repeatDecision != null) {
            return repeatDecision.code().defaultName();
        }

        if (repeatName != null && !repeatName.isBlank()) {
            return repeatName;
        }

        return repeatCode.defaultName();
    }

    private BigDecimal scaleTranscriptDecimal(BigDecimal value) {
        return value == null ? TRANSCRIPT_DECIMAL_ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal gpa(BigDecimal qualityPoints, BigDecimal gpaCredits) {
        if (gpaCredits == null || gpaCredits.compareTo(BigDecimal.ZERO) == 0) {
            return GPA_ZERO;
        }

        return qualityPoints.divide(gpaCredits, 4, RoundingMode.HALF_UP);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private record CourseKey(String subjectCode, String courseNumber) {
        private static CourseKey from(RawTranscriptCourseRow row) {
            return new CourseKey(normalizeKey(row.subjectCode()), normalizeKey(row.courseNumber()));
        }
    }

    private record CourseAttemptKey(Long recordId, String sourceCode) {
        private static CourseAttemptKey from(RawTranscriptCourseRow row) {
            return new CourseAttemptKey(row.recordId(), row.sourceCode());
        }
    }

    private record RepeatDecision(TranscriptRepeatCode code) {
    }

    private static String normalizeKey(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
