package com.msm.sis.api.service.student;

import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentCompletedCourseTimelineService {
    private final StudentSectionEnrollmentRepository studentSectionEnrollmentRepository;

    @Transactional(readOnly = true)
    public List<StudentCompletedCourseTimelineYear> getCompletedLocalCourseTimeline(Long studentId) {
        requirePositiveId(studentId, "Student id");

        List<StudentSectionEnrollmentRepository.StudentCompletedLocalCourseProjection> rows =
                studentSectionEnrollmentRepository.findCompletedLocalCourses(studentId);
        Map<AcademicYearKey, Map<TermKey, List<StudentCompletedCourseTimelineCourse>>> coursesByTermByYear =
                new LinkedHashMap<>();

        for (StudentSectionEnrollmentRepository.StudentCompletedLocalCourseProjection row : rows) {
            AcademicYearKey yearKey = AcademicYearKey.from(row);
            TermKey termKey = TermKey.from(row);
            coursesByTermByYear
                    .computeIfAbsent(yearKey, ignored -> new LinkedHashMap<>())
                    .computeIfAbsent(termKey, ignored -> new ArrayList<>())
                    .add(toCourse(row));
        }

        List<StudentCompletedCourseTimelineYear> timelineYears = new ArrayList<>();
        int yearSortOrder = 0;
        for (Map.Entry<AcademicYearKey, Map<TermKey, List<StudentCompletedCourseTimelineCourse>>> yearEntry
                : coursesByTermByYear.entrySet()) {
            List<StudentCompletedCourseTimelineTerm> terms = new ArrayList<>();
            int termSortOrder = 0;
            for (Map.Entry<TermKey, List<StudentCompletedCourseTimelineCourse>> termEntry
                    : yearEntry.getValue().entrySet()) {
                TermKey termKey = termEntry.getKey();
                terms.add(new StudentCompletedCourseTimelineTerm(
                        termKey.termId(),
                        termKey.termCode(),
                        termKey.termName(),
                        termKey.termStartDate(),
                        termKey.termEndDate(),
                        termSortOrder++,
                        termKey.termSortDate(),
                        List.copyOf(termEntry.getValue())
                ));
            }

            AcademicYearKey yearKey = yearEntry.getKey();
            timelineYears.add(new StudentCompletedCourseTimelineYear(
                    yearKey.academicYearId(),
                    yearKey.academicYearCode(),
                    yearKey.academicYearName(),
                    yearKey.academicYearStartDate(),
                    yearKey.academicYearEndDate(),
                    yearSortOrder++,
                    List.copyOf(terms)
            ));
        }

        return timelineYears.stream()
                .sorted(Comparator.comparing(StudentCompletedCourseTimelineYear::sortOrder))
                .toList();
    }

    private StudentCompletedCourseTimelineCourse toCourse(
            StudentSectionEnrollmentRepository.StudentCompletedLocalCourseProjection row
    ) {
        return new StudentCompletedCourseTimelineCourse(
                row.getEnrollmentId(),
                row.getCourseId(),
                row.getDepartmentId(),
                row.getSubjectCode(),
                row.getCourseNumber(),
                row.getCourseCode(),
                row.getTitle(),
                row.getCreditsEarned(),
                row.getGradeCode(),
                row.getCompletedDate()
        );
    }

    private record AcademicYearKey(
            Long academicYearId,
            String academicYearCode,
            String academicYearName,
            java.time.LocalDate academicYearStartDate,
            java.time.LocalDate academicYearEndDate
    ) {
        static AcademicYearKey from(
                StudentSectionEnrollmentRepository.StudentCompletedLocalCourseProjection row
        ) {
            return new AcademicYearKey(
                    row.getAcademicYearId(),
                    row.getAcademicYearCode(),
                    row.getAcademicYearName(),
                    row.getAcademicYearStartDate(),
                    row.getAcademicYearEndDate()
            );
        }
    }

    private record TermKey(
            Long termId,
            String termCode,
            String termName,
            java.time.LocalDate termStartDate,
            java.time.LocalDate termEndDate,
            java.time.LocalDate termSortDate
    ) {
        static TermKey from(
                StudentSectionEnrollmentRepository.StudentCompletedLocalCourseProjection row
        ) {
            return new TermKey(
                    row.getTermId(),
                    row.getTermCode(),
                    row.getTermName(),
                    row.getTermStartDate(),
                    row.getTermEndDate(),
                    row.getTermSortDate()
            );
        }
    }
}
