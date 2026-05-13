package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.CodeNameRegistrationOptionResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupBuilderPreviewGroupResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupBuilderPreviewRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupBuilderPreviewResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupBuilderPreviewStudentResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupExistingAssignmentResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AthleticSport;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.RegistrationGroup;
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

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class RegistrationGroupBuilderPreviewService {
    private static final BigDecimal ZERO_CREDITS = BigDecimal.ZERO;
    private static final String HONORS_ANY = "ANY";
    private static final String HONORS_ONLY = "HONORS";
    private static final String HONORS_NOT = "NOT_HONORS";
    private static final String ATHLETE_ANY = "ANY";
    private static final String ATHLETE_ONLY = "ATHLETE";
    private static final String ATHLETE_NOT = "NOT_ATHLETE";
    private static final String GROUP_ANY = "ANY";
    private static final String GROUP_EXCLUDE = "EXCLUDE_ALREADY_GROUPED";
    private static final String GROUP_ONLY = "ONLY_ALREADY_GROUPED";
    private static final String DEFAULT_GROUP_NAME_PREFIX = "Registration Group";
    private static final int MAX_SPLIT_COUNT = 100;

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
    public RegistrationGroupBuilderPreviewResponse previewRegistrationGroups(
            RegistrationGroupBuilderPreviewRequest request
    ) {
        RegistrationGroupBuilderPreviewRequest requiredRequest = requireRequestBody(request);
        AcademicYear academicYear = academicYearRepository.findById(
                        requirePositiveId(requiredRequest.academicYearId(), "Academic year id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year was not found."));
        AcademicTerm term = academicTermRepository.findDetailedById(
                        requirePositiveId(requiredRequest.termId(), "Term id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Term was not found."));
        validateTermBelongsToYear(term, academicYear);

        NormalizedPreviewCriteria criteria = normalizeCriteria(requiredRequest);
        List<Student> students = studentRepository.findActiveStudentsForRegistrationGroupPreview();
        if (students.isEmpty()) {
            return new RegistrationGroupBuilderPreviewResponse(0, criteria.splitCount(), List.of());
        }

        List<Long> studentIds = students.stream().map(Student::getId).toList();
        Map<Long, List<StudentProgram>> programsByStudent = loadProgramsByStudent(studentIds);
        Set<Long> honorsStudentIds = studentHonorsRepository.findActiveByStudentIds(studentIds).stream()
                .map(StudentHonors::getStudent)
                .map(Student::getId)
                .collect(HashSet::new, Set::add, Set::addAll);
        Map<Long, List<AthleticSport>> sportsByStudent = loadSportsByStudent(studentIds);
        Map<Long, RegistrationGroupStudent> assignmentsByStudent =
                loadExistingAssignmentsByStudent(studentIds, academicYear.getId(), term.getId());
        Map<Long, BigDecimal> completedCreditsByStudent = loadCompletedCreditsByStudent(studentIds);
        Map<Long, BigDecimal> currentCreditsByStudent = criteria.includeCurrentCredits()
                ? loadCurrentCreditsByStudent(studentIds)
                : Map.of();
        Map<Long, BigDecimal> transferCreditsByStudent = criteria.includeTransferCredits()
                ? loadTransferCreditsByStudent(studentIds)
                : Map.of();
        Map<Long, List<AcademicDivision>> academicDivisionsByStudent =
                academicCareerEligibilityService.getAllowedAcademicDivisionsByStudentId(studentIds);

        List<PreviewStudent> matchingStudents = students.stream()
                .filter(student -> !academicDivisionsByStudent.getOrDefault(student.getId(), List.of()).isEmpty())
                .map(student -> toPreviewStudent(
                        student,
                        programsByStudent.getOrDefault(student.getId(), List.of()),
                        honorsStudentIds.contains(student.getId()),
                        sportsByStudent.getOrDefault(student.getId(), List.of()),
                        assignmentsByStudent.get(student.getId()),
                        completedCreditsByStudent.getOrDefault(student.getId(), ZERO_CREDITS),
                        currentCreditsByStudent.getOrDefault(student.getId(), ZERO_CREDITS),
                        transferCreditsByStudent.getOrDefault(student.getId(), ZERO_CREDITS),
                        academicDivisionsByStudent.getOrDefault(student.getId(), List.of())
                ))
                .filter(student -> matchesCriteria(student, criteria))
                .sorted(Comparator
                        .comparing(PreviewStudent::totalCredits, Comparator.reverseOrder())
                        .thenComparing(PreviewStudent::displayName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(student -> student.response().studentId()))
                .toList();

        List<RegistrationGroupBuilderPreviewGroupResponse> groups =
                splitStudents(matchingStudents, criteria.splitCount(), criteria.groupNamePrefix(), academicYear, term);

        return new RegistrationGroupBuilderPreviewResponse(
                matchingStudents.size(),
                groups.size(),
                groups
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

    private NormalizedPreviewCriteria normalizeCriteria(RegistrationGroupBuilderPreviewRequest request) {
        int splitCount = request.splitCount() == null ? 1 : request.splitCount();
        if (splitCount < 1 || splitCount > MAX_SPLIT_COUNT) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Split count must be between 1 and " + MAX_SPLIT_COUNT + "."
            );
        }

        BigDecimal minCredits = request.minCredits();
        BigDecimal maxCredits = request.maxCredits();
        if (minCredits != null && minCredits.compareTo(ZERO_CREDITS) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum credits cannot be negative.");
        }
        if (maxCredits != null && maxCredits.compareTo(ZERO_CREDITS) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum credits cannot be negative.");
        }
        if (minCredits != null && maxCredits != null && minCredits.compareTo(maxCredits) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Minimum credits cannot be greater than maximum credits."
            );
        }

        return new NormalizedPreviewCriteria(
                normalizeSearchTerm(request.studentSearchText()),
                normalizeSearchTerm(request.programSearchText()),
                normalizeGroupNamePrefix(request.groupNamePrefix()),
                normalizeAcademicDivisionIds(request),
                normalizeEnum(request.honorsFilter(), HONORS_ANY, Set.of(HONORS_ANY, HONORS_ONLY, HONORS_NOT), "Honors filter"),
                normalizeEnum(request.athleteFilter(), ATHLETE_ANY, Set.of(ATHLETE_ANY, ATHLETE_ONLY, ATHLETE_NOT), "Athlete filter"),
                normalizeSportIds(request.athleticSportIds()),
                normalizeEnum(request.existingGroupFilter(), GROUP_EXCLUDE, Set.of(GROUP_ANY, GROUP_EXCLUDE, GROUP_ONLY), "Existing group filter"),
                minCredits,
                maxCredits,
                request.includeCurrentCredits(),
                request.includeTransferCredits(),
                splitCount
        );
    }

    private Long normalizeOptionalId(Long id, String label) {
        if (id == null) {
            return null;
        }
        return requirePositiveId(id, label);
    }

    private List<Long> normalizeAcademicDivisionIds(RegistrationGroupBuilderPreviewRequest request) {
        LinkedHashSet<Long> normalizedIds = new LinkedHashSet<>();
        if (request.academicDivisionIds() != null) {
            for (Long academicDivisionId : request.academicDivisionIds()) {
                normalizedIds.add(requirePositiveId(academicDivisionId, "Academic division id"));
            }
        }
        if (normalizedIds.isEmpty() && request.academicDivisionId() != null) {
            normalizedIds.add(requirePositiveId(request.academicDivisionId(), "Academic division id"));
        }
        return List.copyOf(normalizedIds);
    }

    private List<Long> normalizeSportIds(List<Long> athleticSportIds) {
        if (athleticSportIds == null || athleticSportIds.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<Long> normalizedIds = new LinkedHashSet<>();
        for (Long athleticSportId : athleticSportIds) {
            normalizedIds.add(requirePositiveId(athleticSportId, "Athletic sport id"));
        }
        return List.copyOf(normalizedIds);
    }

    private String normalizeEnum(String value, String defaultValue, Set<String> allowedValues, String label) {
        String normalizedValue = trimToNull(value);
        if (normalizedValue == null) {
            return defaultValue;
        }

        String upperValue = normalizedValue.toUpperCase(Locale.ROOT);
        if (!allowedValues.contains(upperValue)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is not supported.");
        }
        return upperValue;
    }

    private String normalizeSearchTerm(String value) {
        String normalizedValue = trimToNull(value);
        return normalizedValue == null ? null : normalizedValue.toLowerCase(Locale.ROOT);
    }

    private String normalizeGroupNamePrefix(String value) {
        String normalizedValue = trimToNull(value);
        if (normalizedValue == null) {
            return DEFAULT_GROUP_NAME_PREFIX;
        }
        if (normalizedValue.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Group name prefix must be 255 characters or fewer.");
        }
        return normalizedValue;
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

    private Map<Long, RegistrationGroupStudent> loadExistingAssignmentsByStudent(
            List<Long> studentIds,
            Long academicYearId,
            Long termId
    ) {
        Map<Long, RegistrationGroupStudent> assignmentsByStudent = new HashMap<>();
        registrationGroupStudentRepository.findAssignmentsForStudentsInPeriod(studentIds, academicYearId, termId)
                .forEach(registrationGroupStudent -> assignmentsByStudent.putIfAbsent(
                        registrationGroupStudent.getStudent().getId(),
                        registrationGroupStudent
                ));
        return assignmentsByStudent;
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

    private PreviewStudent toPreviewStudent(
            Student student,
            List<StudentProgram> programs,
            boolean honors,
            List<AthleticSport> athleticSports,
            RegistrationGroupStudent existingAssignment,
            BigDecimal completedCredits,
            BigDecimal currentCredits,
            BigDecimal transferCredits,
            List<AcademicDivision> academicDivisions
    ) {
        AcademicDivision academicDivision = displayAcademicDivision(academicDivisions);
        Set<Long> academicDivisionIds = academicDivisionIds(academicDivisions);
        String academicDivisionCodes = academicDivisionCodes(academicDivisions);
        String academicDivisionNames = academicDivisionNames(academicDivisions);
        BigDecimal totalCredits = completedCredits.add(currentCredits).add(transferCredits);
        RegistrationGroupBuilderPreviewStudentResponse response = new RegistrationGroupBuilderPreviewStudentResponse(
                student.getId(),
                student.getAltId(),
                student.getFirstName(),
                student.getLastName(),
                buildDisplayName(student),
                student.getEmail(),
                academicDivision == null ? null : academicDivision.getId(),
                academicDivisionCodes,
                academicDivisionNames,
                student.getClassStandingId(),
                student.getClassStanding() == null ? null : student.getClassStanding().getName(),
                student.getEstimatedGradDate(),
                programNames(programs),
                honors,
                athleticSports.stream()
                        .map(this::toSportOption)
                        .toList(),
                completedCredits,
                currentCredits,
                transferCredits,
                totalCredits,
                toExistingAssignmentResponse(existingAssignment)
        );

        return new PreviewStudent(response, totalCredits, academicDivisionIds);
    }

    private AcademicDivision displayAcademicDivision(List<AcademicDivision> academicDivisions) {
        return academicDivisions.isEmpty() ? null : academicDivisions.getFirst();
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

    private Set<Long> academicDivisionIds(List<AcademicDivision> academicDivisions) {
        return academicDivisions.stream()
                .map(AcademicDivision::getId)
                .collect(HashSet::new, Set::add, Set::addAll);
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

    private RegistrationGroupExistingAssignmentResponse toExistingAssignmentResponse(
            RegistrationGroupStudent registrationGroupStudent
    ) {
        if (registrationGroupStudent == null) {
            return null;
        }

        RegistrationGroup registrationGroup = registrationGroupStudent.getRegistrationGroup();
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        String statusCode = normalizeStatusCode(registrationGroup.getStatus());

        return new RegistrationGroupExistingAssignmentResponse(
                registrationGroup.getId(),
                registrationGroup.getName(),
                statusCode,
                toStatusName(statusCode),
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                term.getId(),
                term.getCode(),
                term.getName()
        );
    }

    private String normalizeStatusCode(String status) {
        String normalizedStatus = trimToNull(status);
        return normalizedStatus == null ? "DRAFT" : normalizedStatus.toUpperCase(Locale.ROOT);
    }

    private String toStatusName(String statusCode) {
        return RegistrationGroupStatusSupport.statusName(statusCode);
    }

    private boolean matchesCriteria(PreviewStudent student, NormalizedPreviewCriteria criteria) {
        RegistrationGroupBuilderPreviewStudentResponse response = student.response();
        if (!matchesStudentSearch(response, criteria.studentSearchText())) {
            return false;
        }
        if (!matchesProgramSearch(response, criteria.programSearchText())) {
            return false;
        }
        if (!criteria.academicDivisionIds().isEmpty()
                && !student.academicDivisionIds().equals(Set.copyOf(criteria.academicDivisionIds()))) {
            return false;
        }
        if (!matchesHonors(response.honors(), criteria.honorsFilter())) {
            return false;
        }
        if (!matchesAthlete(response.athleticSports(), criteria.athleteFilter(), criteria.athleticSportIds())) {
            return false;
        }
        if (!matchesExistingAssignment(response.existingAssignment(), criteria.existingGroupFilter())) {
            return false;
        }
        if (criteria.minCredits() != null && response.totalCredits().compareTo(criteria.minCredits()) < 0) {
            return false;
        }
        return criteria.maxCredits() == null || response.totalCredits().compareTo(criteria.maxCredits()) <= 0;
    }

    private boolean matchesStudentSearch(
            RegistrationGroupBuilderPreviewStudentResponse student,
            String studentSearchText
    ) {
        if (studentSearchText == null) {
            return true;
        }

        return contains(student.displayName(), studentSearchText)
                || contains(student.firstName(), studentSearchText)
                || contains(student.lastName(), studentSearchText)
                || contains(student.email(), studentSearchText)
                || contains(student.studentNumber(), studentSearchText)
                || student.studentId().toString().equals(studentSearchText);
    }

    private boolean matchesProgramSearch(
            RegistrationGroupBuilderPreviewStudentResponse student,
            String programSearchText
    ) {
        return programSearchText == null || student.programNames().stream().anyMatch(name -> contains(name, programSearchText));
    }

    private boolean contains(String value, String normalizedNeedle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedNeedle);
    }

    private boolean matchesHonors(boolean honors, String honorsFilter) {
        return switch (honorsFilter) {
            case HONORS_ONLY -> honors;
            case HONORS_NOT -> !honors;
            default -> true;
        };
    }

    private boolean matchesAthlete(
            List<CodeNameRegistrationOptionResponse> athleticSports,
            String athleteFilter,
            List<Long> athleticSportIds
    ) {
        boolean athlete = !athleticSports.isEmpty();
        if (ATHLETE_ONLY.equals(athleteFilter) && !athlete) {
            return false;
        }
        if (ATHLETE_NOT.equals(athleteFilter) && athlete) {
            return false;
        }

        return athleticSportIds.isEmpty()
                || athleticSports.stream().map(CodeNameRegistrationOptionResponse::id).anyMatch(athleticSportIds::contains);
    }

    private boolean matchesExistingAssignment(
            RegistrationGroupExistingAssignmentResponse existingAssignment,
            String existingGroupFilter
    ) {
        return switch (existingGroupFilter) {
            case GROUP_ONLY -> existingAssignment != null;
            case GROUP_EXCLUDE -> existingAssignment == null;
            default -> true;
        };
    }

    private List<RegistrationGroupBuilderPreviewGroupResponse> splitStudents(
            List<PreviewStudent> students,
            int requestedSplitCount,
            String groupNamePrefix,
            AcademicYear academicYear,
            AcademicTerm term
    ) {
        if (students.isEmpty()) {
            return List.of();
        }

        int groupCount = Math.max(1, Math.min(requestedSplitCount, students.size()));
        List<List<PreviewStudent>> groups = new ArrayList<>();
        for (int index = 0; index < groupCount; index++) {
            groups.add(new ArrayList<>());
        }
        for (int index = 0; index < students.size(); index++) {
            groups.get(index % groupCount).add(students.get(index));
        }

        List<RegistrationGroupBuilderPreviewGroupResponse> responses = new ArrayList<>();
        for (int index = 0; index < groups.size(); index++) {
            List<RegistrationGroupBuilderPreviewStudentResponse> groupStudents = groups.get(index).stream()
                    .map(PreviewStudent::response)
                    .toList();
            BigDecimal totalCredits = groupStudents.stream()
                    .map(RegistrationGroupBuilderPreviewStudentResponse::totalCredits)
                    .reduce(ZERO_CREDITS, BigDecimal::add);

            responses.add(new RegistrationGroupBuilderPreviewGroupResponse(
                    "generated-" + (index + 1),
                    groupNamePrefix + " " + (index + 1),
                    academicYear.getId(),
                    academicYear.getCode(),
                    academicYear.getName(),
                    term.getId(),
                    term.getCode(),
                    term.getName(),
                    groupStudents.size(),
                    totalCredits,
                    groupStudents
            ));
        }
        return responses;
    }

    private record NormalizedPreviewCriteria(
            String studentSearchText,
            String programSearchText,
            String groupNamePrefix,
            List<Long> academicDivisionIds,
            String honorsFilter,
            String athleteFilter,
            List<Long> athleticSportIds,
            String existingGroupFilter,
            BigDecimal minCredits,
            BigDecimal maxCredits,
            boolean includeCurrentCredits,
            boolean includeTransferCredits,
            int splitCount
    ) {
    }

    private record PreviewStudent(
            RegistrationGroupBuilderPreviewStudentResponse response,
            BigDecimal totalCredits,
            Set<Long> academicDivisionIds
    ) {
        String displayName() {
            return response.displayName();
        }
    }
}
