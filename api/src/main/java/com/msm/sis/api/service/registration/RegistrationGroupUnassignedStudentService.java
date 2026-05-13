package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.CodeNameRegistrationOptionResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupSearchPageResponse;
import com.msm.sis.api.dto.registration.UnassignedRegistrationGroupStudentResponse;
import com.msm.sis.api.dto.registration.UnassignedRegistrationGroupStudentSearchCriteria;
import com.msm.sis.api.dto.registration.UnassignedRegistrationGroupStudentSearchResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AthleticSport;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentAthlete;
import com.msm.sis.api.entity.StudentHonors;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import com.msm.sis.api.repository.StudentAthleteRepository;
import com.msm.sis.api.repository.StudentHonorsRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentTransferCreditRepository;
import com.msm.sis.api.service.student.StudentAcademicCareerEligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class RegistrationGroupUnassignedStudentService {
    private static final BigDecimal ZERO_CREDITS = BigDecimal.ZERO;
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 25;
    private static final int MAX_PAGE_SIZE = 100;

    private final AcademicTermRepository academicTermRepository;
    private final AcademicYearRepository academicYearRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final StudentAcademicCareerEligibilityService academicCareerEligibilityService;
    private final StudentAthleteRepository studentAthleteRepository;
    private final StudentHonorsRepository studentHonorsRepository;
    private final StudentProgramRepository studentProgramRepository;
    private final StudentRepository studentRepository;
    private final StudentSectionEnrollmentRepository studentSectionEnrollmentRepository;
    private final StudentTransferCreditRepository studentTransferCreditRepository;

    @Transactional(readOnly = true)
    public UnassignedRegistrationGroupStudentSearchResponse searchUnassignedStudents(
            UnassignedRegistrationGroupStudentSearchCriteria criteria
    ) {
        UnassignedRegistrationGroupStudentSearchCriteria effectiveCriteria =
                criteria == null ? new UnassignedRegistrationGroupStudentSearchCriteria() : criteria;
        int page = effectiveCriteria.getPage() == null ? DEFAULT_PAGE : effectiveCriteria.getPage();
        int size = effectiveCriteria.getSize() == null ? DEFAULT_SIZE : effectiveCriteria.getSize();
        validatePageRequest(page, size, MAX_PAGE_SIZE);

        AcademicYear academicYear = academicYearRepository.findById(
                        requirePositiveId(effectiveCriteria.getAcademicYearId(), "Academic year id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year was not found."));
        AcademicTerm term = academicTermRepository.findDetailedById(
                        requirePositiveId(effectiveCriteria.getTermId(), "Term id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Term was not found."));
        validateTermBelongsToYear(term, academicYear);

        List<Student> activeStudents = studentRepository.findActiveStudentsForRegistrationGroupPreview();
        if (activeStudents.isEmpty()) {
            return emptyResponse(page, size, academicYear, term);
        }

        List<Long> activeStudentIds = activeStudents.stream().map(Student::getId).toList();
        Set<Long> assignedStudentIds = loadAssignedStudentIds(activeStudentIds, academicYear.getId(), term.getId());
        List<Student> unassignedStudents = activeStudents.stream()
                .filter(student -> !assignedStudentIds.contains(student.getId()))
                .toList();
        if (unassignedStudents.isEmpty()) {
            return emptyResponse(page, size, academicYear, term);
        }

        List<Long> unassignedStudentIds = unassignedStudents.stream().map(Student::getId).toList();
        Map<Long, List<StudentProgram>> programsByStudent = loadProgramsByStudent(unassignedStudentIds);
        Set<Long> honorsStudentIds = loadHonorsStudentIds(unassignedStudentIds);
        Map<Long, List<AthleticSport>> sportsByStudent = loadSportsByStudent(unassignedStudentIds);
        Map<Long, BigDecimal> completedCreditsByStudent = loadCompletedCreditsByStudent(unassignedStudentIds);
        Map<Long, BigDecimal> currentCreditsByStudent = loadCurrentCreditsByStudent(unassignedStudentIds);
        Map<Long, BigDecimal> transferCreditsByStudent = loadTransferCreditsByStudent(unassignedStudentIds);
        Map<Long, List<AcademicDivision>> academicDivisionsByStudent =
                academicCareerEligibilityService.getAllowedAcademicDivisionsByStudentId(unassignedStudentIds);

        String normalizedSearchText = normalizeSearchTerm(effectiveCriteria.getSearchText());
        List<UnassignedRegistrationGroupStudentResponse> sortedResults = unassignedStudents.stream()
                .filter(student -> !academicDivisionsByStudent.getOrDefault(student.getId(), List.of()).isEmpty())
                .map(student -> toResponse(
                        student,
                        programsByStudent.getOrDefault(student.getId(), List.of()),
                        honorsStudentIds.contains(student.getId()),
                        sportsByStudent.getOrDefault(student.getId(), List.of()),
                        completedCreditsByStudent.getOrDefault(student.getId(), ZERO_CREDITS),
                        currentCreditsByStudent.getOrDefault(student.getId(), ZERO_CREDITS),
                        transferCreditsByStudent.getOrDefault(student.getId(), ZERO_CREDITS),
                        academicDivisionsByStudent.getOrDefault(student.getId(), List.of())
                ))
                .filter(response -> matchesSearch(response, normalizedSearchText))
                .sorted(buildComparator(effectiveCriteria.getSortBy(), effectiveCriteria.getSortDirection()))
                .toList();

        long totalElements = sortedResults.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, sortedResults.size());
        int toIndex = Math.min(fromIndex + size, sortedResults.size());

        return new UnassignedRegistrationGroupStudentSearchResponse(
                new RegistrationGroupSearchPageResponse(page, size, totalElements, totalPages),
                totalElements,
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                term.getId(),
                term.getCode(),
                term.getName(),
                sortedResults.subList(fromIndex, toIndex)
        );
    }

    private UnassignedRegistrationGroupStudentSearchResponse emptyResponse(
            int page,
            int size,
            AcademicYear academicYear,
            AcademicTerm term
    ) {
        return new UnassignedRegistrationGroupStudentSearchResponse(
                new RegistrationGroupSearchPageResponse(page, size, 0, 0),
                0,
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                term.getId(),
                term.getCode(),
                term.getName(),
                List.of()
        );
    }

    private void validateTermBelongsToYear(AcademicTerm term, AcademicYear academicYear) {
        AcademicYear termAcademicYear = term.getAcademicYear();
        if (termAcademicYear == null || !academicYear.getId().equals(termAcademicYear.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Term must belong to the selected academic year."
            );
        }
    }

    private Set<Long> loadAssignedStudentIds(
            List<Long> studentIds,
            Long academicYearId,
            Long termId
    ) {
        Set<Long> assignedStudentIds = new HashSet<>();
        registrationGroupStudentRepository.findAssignmentsForStudentsInPeriod(studentIds, academicYearId, termId)
                .stream()
                .map(RegistrationGroupStudent::getStudent)
                .map(Student::getId)
                .forEach(assignedStudentIds::add);
        return assignedStudentIds;
    }

    private Map<Long, List<StudentProgram>> loadProgramsByStudent(List<Long> studentIds) {
        return studentProgramRepository.findRegistrationPreviewProgramsByStudentIds(studentIds).stream()
                .collect(
                        LinkedHashMap::new,
                        (map, studentProgram) -> map
                                .computeIfAbsent(studentProgram.getStudent().getId(), ignored -> new ArrayList<>())
                                .add(studentProgram),
                        Map::putAll
                );
    }

    private Set<Long> loadHonorsStudentIds(List<Long> studentIds) {
        return studentHonorsRepository.findActiveByStudentIds(studentIds).stream()
                .map(StudentHonors::getStudent)
                .map(Student::getId)
                .collect(HashSet::new, Set::add, Set::addAll);
    }

    private Map<Long, List<AthleticSport>> loadSportsByStudent(List<Long> studentIds) {
        return studentAthleteRepository.findActiveByStudentIds(studentIds).stream()
                .collect(
                        LinkedHashMap::new,
                        (map, athlete) -> map
                                .computeIfAbsent(athlete.getStudent().getId(), ignored -> new ArrayList<>())
                                .add(athlete.getAthleticSport()),
                        Map::putAll
                );
    }

    private Map<Long, BigDecimal> loadCompletedCreditsByStudent(List<Long> studentIds) {
        Map<Long, BigDecimal> creditsByStudent = new HashMap<>();
        studentSectionEnrollmentRepository.sumCompletedCreditsByStudentIds(studentIds)
                .forEach(total -> creditsByStudent.put(total.getStudentId(), normalizeCredits(total.getCredits())));
        return creditsByStudent;
    }

    private Map<Long, BigDecimal> loadCurrentCreditsByStudent(List<Long> studentIds) {
        Map<Long, BigDecimal> creditsByStudent = new HashMap<>();
        studentSectionEnrollmentRepository.sumCurrentCreditsByStudentIds(studentIds)
                .forEach(total -> creditsByStudent.put(total.getStudentId(), normalizeCredits(total.getCredits())));
        return creditsByStudent;
    }

    private Map<Long, BigDecimal> loadTransferCreditsByStudent(List<Long> studentIds) {
        Map<Long, BigDecimal> creditsByStudent = new HashMap<>();
        studentTransferCreditRepository.sumTransferCreditsByStudentIds(studentIds)
                .forEach(total -> creditsByStudent.put(total.getStudentId(), normalizeCredits(total.getCredits())));
        return creditsByStudent;
    }

    private BigDecimal normalizeCredits(BigDecimal credits) {
        return credits == null ? ZERO_CREDITS : credits;
    }

    private UnassignedRegistrationGroupStudentResponse toResponse(
            Student student,
            List<StudentProgram> programs,
            boolean honors,
            List<AthleticSport> athleticSports,
            BigDecimal completedCredits,
            BigDecimal currentCredits,
            BigDecimal transferCredits,
            List<AcademicDivision> academicDivisions
    ) {
        String academicDivisionCodes = academicDivisionCodes(academicDivisions);
        String academicDivisionNames = academicDivisionNames(academicDivisions);
        BigDecimal totalCredits = completedCredits.add(currentCredits).add(transferCredits);

        return new UnassignedRegistrationGroupStudentResponse(
                student.getId(),
                student.getAltId(),
                student.getFirstName(),
                student.getLastName(),
                buildDisplayName(student),
                student.getEmail(),
                academicDivisionCodes,
                academicDivisionNames,
                student.getClassStandingId() == null ? null : student.getClassStandingId().longValue(),
                student.getClassStanding() == null ? null : student.getClassStanding().getName(),
                programNames(programs),
                honors,
                athleticSports.stream()
                        .map(this::toSportOption)
                        .toList(),
                completedCredits,
                currentCredits,
                transferCredits,
                totalCredits
        );
    }

    private String academicDivisionCodes(List<AcademicDivision> academicDivisions) {
        return academicDivisions.stream()
                .map(AcademicDivision::getCode)
                .filter(code -> trimToNull(code) != null)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private String academicDivisionNames(List<AcademicDivision> academicDivisions) {
        return academicDivisions.stream()
                .map(AcademicDivision::getName)
                .filter(name -> trimToNull(name) != null)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private String buildDisplayName(Student student) {
        StringBuilder displayName = new StringBuilder();
        appendNamePart(displayName, student.getFirstName());
        appendNamePart(displayName, student.getLastName());
        String builtName = trimToNull(displayName.toString());
        return builtName == null ? "Student " + student.getId() : builtName;
    }

    private void appendNamePart(StringBuilder displayName, String value) {
        String trimmedValue = trimToNull(value);
        if (trimmedValue == null) {
            return;
        }

        if (displayName.length() > 0) {
            displayName.append(' ');
        }
        displayName.append(trimmedValue);
    }

    private List<String> programNames(List<StudentProgram> programs) {
        LinkedHashSet<String> names = new LinkedHashSet<>();
        programs.forEach(studentProgram -> {
            Program program = studentProgram.getProgram();
            if (program != null && trimToNull(program.getName()) != null) {
                names.add(program.getName());
            }
        });
        return List.copyOf(names);
    }

    private CodeNameRegistrationOptionResponse toSportOption(AthleticSport athleticSport) {
        return new CodeNameRegistrationOptionResponse(
                athleticSport.getId(),
                athleticSport.getCode(),
                athleticSport.getName()
        );
    }

    private String normalizeSearchTerm(String value) {
        String normalizedValue = trimToNull(value);
        return normalizedValue == null ? null : normalizedValue.toLowerCase(Locale.ROOT);
    }

    private boolean matchesSearch(
            UnassignedRegistrationGroupStudentResponse student,
            String normalizedSearchText
    ) {
        if (normalizedSearchText == null) {
            return true;
        }

        return contains(student.displayName(), normalizedSearchText)
                || contains(student.firstName(), normalizedSearchText)
                || contains(student.lastName(), normalizedSearchText)
                || contains(student.email(), normalizedSearchText)
                || contains(student.studentNumber(), normalizedSearchText)
                || student.studentId().toString().equals(normalizedSearchText)
                || student.programNames().stream().anyMatch(programName -> contains(programName, normalizedSearchText));
    }

    private boolean contains(String value, String normalizedNeedle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedNeedle);
    }

    private Comparator<UnassignedRegistrationGroupStudentResponse> buildComparator(
            String sortBy,
            String sortDirection
    ) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String normalizedSortBy = normalizeSortBy(sortBy, "student");

        Comparator<UnassignedRegistrationGroupStudentResponse> comparator = switch (normalizedSortBy) {
            case "academicDivision" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::academicDivisionName, nullSafeStringComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "athletics" -> Comparator
                    .comparing(this::firstSportName, nullSafeStringComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "completedCredits" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::completedCredits, nullSafeCreditComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "currentCredits" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::currentCredits, nullSafeCreditComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "email" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::email, nullSafeStringComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "honors" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::honors)
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "program" -> Comparator
                    .comparing(this::firstProgramName, nullSafeStringComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "student" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::lastName, nullSafeStringComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::firstName, nullSafeStringComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::email, nullSafeStringComparator());
            case "studentNumber" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::studentNumber, nullSafeStringComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "totalCredits" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::totalCredits, nullSafeCreditComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            case "transferCredits" -> Comparator
                    .comparing(UnassignedRegistrationGroupStudentResponse::transferCredits, nullSafeCreditComparator())
                    .thenComparing(UnassignedRegistrationGroupStudentResponse::displayName, nullSafeStringComparator());
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: academicDivision, athletics, completedCredits, currentCredits, email, honors, program, student, studentNumber, totalCredits, transferCredits."
            );
        };

        if (direction.isDescending()) {
            comparator = comparator.reversed();
        }

        return comparator.thenComparing(UnassignedRegistrationGroupStudentResponse::studentId);
    }

    private String firstProgramName(UnassignedRegistrationGroupStudentResponse response) {
        return response.programNames().isEmpty() ? null : response.programNames().getFirst();
    }

    private String firstSportName(UnassignedRegistrationGroupStudentResponse response) {
        return response.athleticSports().isEmpty() ? null : response.athleticSports().getFirst().name();
    }

    private Comparator<String> nullSafeStringComparator() {
        return Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
    }

    private Comparator<BigDecimal> nullSafeCreditComparator() {
        return Comparator.nullsLast(BigDecimal::compareTo);
    }
}
