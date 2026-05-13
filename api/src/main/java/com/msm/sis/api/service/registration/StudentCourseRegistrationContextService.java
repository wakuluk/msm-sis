package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationGroupChoiceResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationGroupChoicesResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationSubTermResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationWindowResponse;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentCourseRegistrationContextService {
    private final RegistrationGroupLifecycleService lifecycleService;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public StudentCourseRegistrationWindowResponse getRegistrationWindowForAuthenticatedStudent(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));

        return getRegistrationWindowForStudent(student.getId());
    }

    @Transactional(readOnly = true)
    public StudentCourseRegistrationWindowResponse getRegistrationWindowForAuthenticatedStudent(
            Long userId,
            Long registrationGroupId,
            Long termId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));

        return getRegistrationWindowForStudent(student.getId(), registrationGroupId, termId);
    }

    @Transactional(readOnly = true)
    public StudentCourseRegistrationGroupChoicesResponse getRegistrationGroupChoicesForAuthenticatedStudent(
            Long userId
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user is not linked to a student record."
                ));

        return getRegistrationGroupChoicesForStudent(student.getId());
    }

    @Transactional(readOnly = true)
    public StudentCourseRegistrationGroupChoicesResponse getRegistrationGroupChoicesForStudent(Long studentId) {
        lifecycleService.closeExpiredPublishedGroups();

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        List<RegistrationGroupStudent> assignments = registrationGroupStudentRepository
                .findViewableAssignmentsForStudent(studentId).stream()
                .filter(assignment -> assignment.getRegistrationGroup() != null)
                .collect(Collectors.toMap(
                        assignment -> assignment.getRegistrationGroup().getId(),
                        Function.identity(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted((first, second) -> compareRegistrationGroupAssignments(first, second, today))
                .toList();

        Long selectedRegistrationGroupId = assignments.stream()
                .findFirst()
                .map(RegistrationGroupStudent::getRegistrationGroup)
                .map(RegistrationGroup::getId)
                .orElse(null);
        List<StudentCourseRegistrationGroupChoiceResponse> choices = assignments.stream()
                .map(assignment -> toGroupChoiceResponse(
                        assignment.getRegistrationGroup(),
                        now,
                        Objects.equals(
                                selectedRegistrationGroupId,
                                assignment.getRegistrationGroup().getId()
                        )
                ))
                .toList();

        return new StudentCourseRegistrationGroupChoicesResponse(selectedRegistrationGroupId, choices);
    }

    @Transactional(readOnly = true)
    public StudentCourseRegistrationWindowResponse getRegistrationWindowForStudent(Long studentId) {
        lifecycleService.closeExpiredPublishedGroups();

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        RegistrationGroupStudent assignment = findCurrentOrUpcomingAssignment(studentId, today);

        return toRegistrationWindowResponse(assignment.getRegistrationGroup(), now);
    }

    @Transactional(readOnly = true)
    public StudentCourseRegistrationWindowResponse getRegistrationWindowForStudent(
            Long studentId,
            Long registrationGroupId,
            Long termId
    ) {
        if (registrationGroupId == null && termId == null) {
            return getRegistrationWindowForStudent(studentId);
        }

        lifecycleService.closeExpiredPublishedGroups();

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        RegistrationGroupStudent assignment = registrationGroupId != null
                ? findViewableAssignmentForGroup(studentId, registrationGroupId)
                : findViewableAssignmentForTerm(studentId, termId, today);

        return toRegistrationWindowResponse(assignment.getRegistrationGroup(), now);
    }

    private StudentCourseRegistrationWindowResponse toRegistrationWindowResponse(
            RegistrationGroup registrationGroup,
            LocalDateTime now
    ) {
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        String statusCode = normalizeStatusCode(registrationGroup.getStatus());

        return new StudentCourseRegistrationWindowResponse(
                registrationGroup.getId(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                statusCode,
                RegistrationGroupStatusSupport.statusName(statusCode),
                registrationGroup.getRegistrationOpensAt(),
                registrationGroup.getRegistrationClosesAt(),
                now,
                isRegistrationWindowOpen(registrationGroup, now),
                term == null ? List.of() : toSubTermResponses(term)
        );
    }

    private RegistrationGroupStudent findViewableAssignmentForGroup(Long studentId, Long registrationGroupId) {
        return registrationGroupStudentRepository
                .findViewableAssignmentByRegistrationGroupIdAndStudentId(registrationGroupId, studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration group was not found for this student."
                ));
    }

    private RegistrationGroupStudent findViewableAssignmentForTerm(
            Long studentId,
            Long termId,
            LocalDate today
    ) {
        List<RegistrationGroupStudent> assignments = registrationGroupStudentRepository
                .findViewableAssignmentsForStudentAndTerm(studentId, termId);
        if (assignments.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Registration term was not found for this student."
            );
        }

        Map<Long, RegistrationGroupStudent> assignmentsByGroupId = assignments.stream()
                .filter(assignment -> assignment.getRegistrationGroup() != null)
                .collect(Collectors.toMap(
                        assignment -> assignment.getRegistrationGroup().getId(),
                        Function.identity(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));

        return assignmentsByGroupId.values().stream()
                .sorted((first, second) -> compareRegistrationGroupAssignments(first, second, today))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration term was not found for this student."
                ));
    }

    private StudentCourseRegistrationGroupChoiceResponse toGroupChoiceResponse(
            RegistrationGroup registrationGroup,
            LocalDateTime now,
            boolean defaultSelection
    ) {
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        String statusCode = normalizeStatusCode(registrationGroup.getStatus());

        return new StudentCourseRegistrationGroupChoiceResponse(
                registrationGroup.getId(),
                registrationGroup.getName(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                statusCode,
                RegistrationGroupStatusSupport.statusName(statusCode),
                registrationGroup.getRegistrationOpensAt(),
                registrationGroup.getRegistrationClosesAt(),
                isRegistrationWindowOpen(registrationGroup, now),
                defaultSelection
        );
    }

    private int compareRegistrationGroupAssignments(
            RegistrationGroupStudent first,
            RegistrationGroupStudent second,
            LocalDate today
    ) {
        RegistrationGroup firstGroup = first.getRegistrationGroup();
        RegistrationGroup secondGroup = second.getRegistrationGroup();
        int firstBucket = registrationGroupSortBucket(firstGroup, today);
        int secondBucket = registrationGroupSortBucket(secondGroup, today);
        if (firstBucket != secondBucket) {
            return Integer.compare(firstBucket, secondBucket);
        }

        int termComparison = compareTerms(firstGroup.getTerm(), secondGroup.getTerm(), firstBucket);
        if (termComparison != 0) {
            return termComparison;
        }

        int opensComparison = compareNullable(
                firstGroup.getRegistrationOpensAt(),
                secondGroup.getRegistrationOpensAt(),
                firstBucket == 2
        );
        if (opensComparison != 0) {
            return opensComparison;
        }

        return compareNullable(firstGroup.getId(), secondGroup.getId(), false);
    }

    private int registrationGroupSortBucket(RegistrationGroup registrationGroup, LocalDate today) {
        AcademicTerm term = registrationGroup.getTerm();
        String statusCode = normalizeStatusCode(registrationGroup.getStatus());
        if (RegistrationGroupStatusSupport.PUBLISHED.equals(statusCode)
                && term != null
                && term.getStartDate() != null
                && term.getEndDate() != null
                && !term.getStartDate().isAfter(today)
                && !term.getEndDate().isBefore(today)) {
            return 0;
        }
        if (RegistrationGroupStatusSupport.PUBLISHED.equals(statusCode)
                && term != null
                && term.getEndDate() != null
                && !term.getEndDate().isBefore(today)) {
            return 1;
        }
        if (RegistrationGroupStatusSupport.CLOSED.equals(statusCode)) {
            return 2;
        }

        return 3;
    }

    private int compareTerms(AcademicTerm first, AcademicTerm second, int bucket) {
        int startComparison = compareNullable(
                first == null ? null : first.getStartDate(),
                second == null ? null : second.getStartDate(),
                bucket == 2
        );
        if (startComparison != 0) {
            return startComparison;
        }

        return compareNullable(
                first == null ? null : first.getId(),
                second == null ? null : second.getId(),
                false
        );
    }

    private <T extends Comparable<T>> int compareNullable(T first, T second, boolean descending) {
        if (first == null && second == null) {
            return 0;
        }
        if (first == null) {
            return 1;
        }
        if (second == null) {
            return -1;
        }

        int comparison = first.compareTo(second);
        return descending ? -comparison : comparison;
    }

    private RegistrationGroupStudent findCurrentOrUpcomingAssignment(Long studentId, LocalDate today) {
        List<RegistrationGroupStudent> assignments = registrationGroupStudentRepository
                .findPublishedCurrentOrUpcomingAssignmentsForStudent(studentId, today);
        Map<Long, RegistrationGroupStudent> assignmentsById = assignments.stream()
                .filter(assignment -> assignment.getRegistrationGroup() != null)
                .collect(Collectors.toMap(
                        RegistrationGroupStudent::getId,
                        Function.identity(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));

        return assignmentsById.values().stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No published current or upcoming registration group was found for this student."
                ));
    }

    private boolean isRegistrationWindowOpen(RegistrationGroup registrationGroup, LocalDateTime now) {
        LocalDateTime opensAt = registrationGroup.getRegistrationOpensAt();
        LocalDateTime closesAt = registrationGroup.getRegistrationClosesAt();

        return RegistrationGroupStatusSupport.PUBLISHED.equals(normalizeStatusCode(registrationGroup.getStatus()))
                && opensAt != null
                && closesAt != null
                && !opensAt.isAfter(now)
                && closesAt.isAfter(now);
    }

    private List<StudentCourseRegistrationSubTermResponse> toSubTermResponses(AcademicTerm term) {
        return term.getAcademicSubTerms().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparing(AcademicSubTerm::getSortOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(AcademicSubTerm::getStartDate, Comparator.nullsLast(LocalDate::compareTo))
                        .thenComparing(AcademicSubTerm::getId, Comparator.nullsLast(Long::compareTo)))
                .map(subTerm -> new StudentCourseRegistrationSubTermResponse(
                        subTerm.getId(),
                        subTerm.getCode(),
                        subTerm.getName(),
                        subTerm.getStartDate(),
                        subTerm.getEndDate(),
                        subTerm.getSortOrder()
                ))
                .toList();
    }

    private String normalizeStatusCode(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        return status.trim().toUpperCase(Locale.ROOT);
    }
}
