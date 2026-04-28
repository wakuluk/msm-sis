package com.msm.sis.api.service;

import com.msm.sis.api.dto.student.transcript.StudentTranscriptCourseResponse;
import com.msm.sis.api.dto.student.transcript.StudentTranscriptCumulativeSummaryResponse;
import com.msm.sis.api.dto.student.transcript.StudentTranscriptResponse;
import com.msm.sis.api.dto.student.transcript.StudentTranscriptSummaryResponse;
import com.msm.sis.api.dto.student.transcript.StudentTranscriptTermResponse;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentTransferCreditRepository;
import com.msm.sis.api.service.transcript.CalculatedTranscriptCourseRow;
import com.msm.sis.api.service.transcript.RawTranscriptCourseRow;
import com.msm.sis.api.service.transcript.TranscriptCalculationService;
import com.msm.sis.api.service.transcript.TranscriptRepeatCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudentTranscriptService {

    private static final Comparator<CalculatedTranscriptCourseRow> CHRONOLOGICAL_ROW_COMPARATOR = Comparator
            .comparing(CalculatedTranscriptCourseRow::termSortDate)
            .thenComparing(CalculatedTranscriptCourseRow::source)
            .thenComparing(CalculatedTranscriptCourseRow::courseCode);

    private final StudentRepository studentRepository;
    private final StudentSectionEnrollmentRepository studentSectionEnrollmentRepository;
    private final StudentTransferCreditRepository studentTransferCreditRepository;
    private final TranscriptCalculationService transcriptCalculationService;

    public StudentTranscriptService(
            StudentRepository studentRepository,
            StudentSectionEnrollmentRepository studentSectionEnrollmentRepository,
            StudentTransferCreditRepository studentTransferCreditRepository,
            TranscriptCalculationService transcriptCalculationService
    ) {
        this.studentRepository = studentRepository;
        this.studentSectionEnrollmentRepository = studentSectionEnrollmentRepository;
        this.studentTransferCreditRepository = studentTransferCreditRepository;
        this.transcriptCalculationService = transcriptCalculationService;
    }

    public StudentTranscriptResponse getTranscriptForStudent(Long studentId) {
        Student student = studentRepository.findByIdWithDetails(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<RawTranscriptCourseRow> rawRows = new ArrayList<>();
        rawRows.addAll(studentSectionEnrollmentRepository.findTranscriptLocalCourses(studentId)
                .stream()
                .map(this::toRow)
                .toList());
        rawRows.addAll(studentTransferCreditRepository.findTranscriptTransferCourses(studentId)
                .stream()
                .map(this::toRow)
                .toList());

        List<CalculatedTranscriptCourseRow> rows = new ArrayList<>(transcriptCalculationService.calculateRows(rawRows));
        rows.sort(CHRONOLOGICAL_ROW_COMPARATOR);

        return new StudentTranscriptResponse(
                student.getId(),
                student.getAltId(),
                formatStudentName(student),
                buildTermsMostRecentFirst(rows),
                buildCumulativeSummary(rows)
        );
    }

    public StudentTranscriptResponse getTranscriptForAuthenticatedStudent(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return getTranscriptForStudent(student.getId());
    }

    private List<StudentTranscriptTermResponse> buildTermsMostRecentFirst(List<CalculatedTranscriptCourseRow> rows) {
        Map<TermKey, List<CalculatedTranscriptCourseRow>> groupedRows = new LinkedHashMap<>();
        for (CalculatedTranscriptCourseRow row : rows) {
            groupedRows.computeIfAbsent(
                    new TermKey(row.termLabel(), row.source(), row.termSortDate()),
                    ignored -> new ArrayList<>()
            ).add(row);
        }

        List<StudentTranscriptTermResponse> terms = new ArrayList<>();
        List<CalculatedTranscriptCourseRow> careerRows = new ArrayList<>();
        Map<TermKey, StudentTranscriptSummaryResponse> careerSummaryByTerm = new LinkedHashMap<>();
        for (Map.Entry<TermKey, List<CalculatedTranscriptCourseRow>> entry : groupedRows.entrySet()) {
            careerRows.addAll(entry.getValue());
            List<StudentTranscriptCourseResponse> courses = entry.getValue()
                    .stream()
                    .map(CalculatedTranscriptCourseRow::courseResponse)
                    .toList();
            careerSummaryByTerm.put(entry.getKey(), transcriptCalculationService.summarize(careerRows));

            terms.add(new StudentTranscriptTermResponse(
                    entry.getKey().label(),
                    entry.getKey().source(),
                    entry.getKey().sortDate(),
                    entry.getValue().stream().anyMatch(CalculatedTranscriptCourseRow::midterm),
                    courses,
                    transcriptCalculationService.summarize(entry.getValue()),
                    careerSummaryByTerm.get(entry.getKey())
            ));
        }

        terms.sort(Comparator
                .comparing(StudentTranscriptTermResponse::sortDate)
                .reversed()
                .thenComparing(StudentTranscriptTermResponse::source)
                .thenComparing(StudentTranscriptTermResponse::label));
        return terms;
    }

    private StudentTranscriptCumulativeSummaryResponse buildCumulativeSummary(List<CalculatedTranscriptCourseRow> rows) {
        List<CalculatedTranscriptCourseRow> transfer = new ArrayList<>();
        List<CalculatedTranscriptCourseRow> local = new ArrayList<>();

        for (CalculatedTranscriptCourseRow row : rows) {
            if (row.transfer()) {
                transfer.add(row);
            } else {
                local.add(row);
            }
        }

        return new StudentTranscriptCumulativeSummaryResponse(
                transcriptCalculationService.summarize(transfer),
                transcriptCalculationService.summarize(local),
                transcriptCalculationService.summarize(rows)
        );
    }

    private RawTranscriptCourseRow toRow(StudentSectionEnrollmentRepository.StudentTranscriptCourseProjection projection) {
        return new RawTranscriptCourseRow(
                projection.getRecordId(),
                projection.getTermLabel(),
                projection.getTermSortDate(),
                normalizeCode(projection.getSource()),
                isCode(projection.getSource(), "TRANSFER"),
                projection.getSubjectCode(),
                projection.getCourseNumber(),
                projection.getTitle(),
                normalizeCode(projection.getStatusCode()),
                projection.getStatusName(),
                isCode(projection.getStatusCode(), "COMPLETED"),
                isAnyCode(projection.getStatusCode(), List.of("DROPPED", "WITHDRAWN")),
                TranscriptRepeatCode.fromCode(projection.getRepeatCode()),
                projection.getRepeatName(),
                normalizeCode(projection.getGradeCode()),
                normalizeCode(projection.getGradeTypeCode()),
                isCode(projection.getGradeCode(), "P"),
                isCode(projection.getGradeTypeCode(), "MIDTERM"),
                projection.getAttemptedCredits(),
                projection.getEarnedCredits(),
                projection.getIncludeInGpa(),
                projection.getEarnsCredit(),
                projection.getCountsInGpa(),
                projection.getQualityPointsPerCredit()
        );
    }

    private RawTranscriptCourseRow toRow(StudentTransferCreditRepository.StudentTranscriptCourseProjection projection) {
        return new RawTranscriptCourseRow(
                projection.getRecordId(),
                projection.getTermLabel(),
                projection.getTermSortDate(),
                normalizeCode(projection.getSource()),
                isCode(projection.getSource(), "TRANSFER"),
                projection.getSubjectCode(),
                projection.getCourseNumber(),
                projection.getTitle(),
                normalizeCode(projection.getStatusCode()),
                projection.getStatusName(),
                isCode(projection.getStatusCode(), "COMPLETED"),
                isAnyCode(projection.getStatusCode(), List.of("DROPPED", "WITHDRAWN")),
                TranscriptRepeatCode.fromCode(projection.getRepeatCode()),
                projection.getRepeatName(),
                normalizeCode(projection.getGradeCode()),
                normalizeCode(projection.getGradeTypeCode()),
                isCode(projection.getGradeCode(), "P"),
                isCode(projection.getGradeTypeCode(), "MIDTERM"),
                projection.getAttemptedCredits(),
                projection.getEarnedCredits(),
                projection.getIncludeInGpa(),
                projection.getEarnsCredit(),
                projection.getCountsInGpa(),
                projection.getQualityPointsPerCredit()
        );
    }

    private String formatStudentName(Student student) {
        String firstName = nullToBlank(student.getFirstName());
        String lastName = nullToBlank(student.getLastName());
        return (firstName + " " + lastName).trim();
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private String normalizeCode(String value) {
        String normalizedValue = nullToBlank(value).trim().toUpperCase();
        return normalizedValue.isBlank() ? null : normalizedValue;
    }

    private boolean isCode(String value, String code) {
        return code.equals(normalizeCode(value));
    }

    private boolean isAnyCode(String value, List<String> codes) {
        return codes.contains(normalizeCode(value));
    }

    private record TermKey(String label, String source, LocalDate sortDate) {
    }
}
