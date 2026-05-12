package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupGenerationCreateGroupRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupGenerationCreateRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupGenerationCreateResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupGenerationCreatedGroupResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AthleticSport;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupGeneration;
import com.msm.sis.api.entity.RegistrationGroupGenerationSport;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.AcademicDivisionRepository;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.AthleticSportRepository;
import com.msm.sis.api.repository.RegistrationGroupGenerationRepository;
import com.msm.sis.api.repository.RegistrationGroupGenerationSportRepository;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
@RequiredArgsConstructor
public class RegistrationGroupGenerationSaveService {
    private static final BigDecimal ZERO_CREDITS = BigDecimal.ZERO;
    private static final String DEFAULT_GENERATION_NAME = "Registration Group Generation";
    private static final String DEFAULT_GROUP_STATUS = "DRAFT";
    private static final String ASSIGNMENT_SOURCE_GENERATED = "GENERATED";
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

    private final AcademicDivisionRepository academicDivisionRepository;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AthleticSportRepository athleticSportRepository;
    private final RegistrationGroupGenerationRepository generationRepository;
    private final RegistrationGroupGenerationSportRepository generationSportRepository;
    private final RegistrationGroupRepository registrationGroupRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final SisUserRepository sisUserRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public RegistrationGroupGenerationCreateResponse saveGeneratedGroups(
            RegistrationGroupGenerationCreateRequest request,
            Long actorUserId
    ) {
        RegistrationGroupGenerationCreateRequest requiredRequest = requireRequestBody(request);
        AcademicYear academicYear = academicYearRepository.findById(
                        requirePositiveId(requiredRequest.academicYearId(), "Academic year id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year was not found."));
        AcademicTerm term = academicTermRepository.findDetailedById(
                        requirePositiveId(requiredRequest.termId(), "Term id")
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Term was not found."));
        validateTermBelongsToYear(term, academicYear);

        NormalizedGenerationRequest normalizedRequest = normalizeRequest(requiredRequest);
        List<NormalizedGroupRequest> groups = normalizeGroups(requiredRequest.groups());
        Map<Long, Student> studentsById = loadStudents(groups);
        validateStudentsAreNotAlreadyAssignedToTerm(academicYear, term, groups, studentsById);
        List<AthleticSport> selectedSports = loadSelectedSports(normalizedRequest.athleticSportIds());
        SisUser actorUser = resolveActorUser(actorUserId);

        RegistrationGroupGeneration generation = saveGeneration(
                normalizedRequest,
                academicYear,
                term,
                actorUser,
                groups
        );
        saveGenerationSports(generation, selectedSports);
        List<RegistrationGroup> savedGroups = saveGroups(generation, academicYear, term, groups, studentsById, actorUser);

        return toResponse(generation, savedGroups, groups);
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

    private NormalizedGenerationRequest normalizeRequest(RegistrationGroupGenerationCreateRequest request) {
        String name = trimToNull(request.name());
        if (name == null) {
            name = DEFAULT_GENERATION_NAME;
        }
        validateMaxLength(name, 255, "Generation name");

        int splitCount = request.splitCount() == null ? 1 : request.splitCount();
        if (splitCount < 1 || splitCount > MAX_SPLIT_COUNT) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Split count must be between 1 and " + MAX_SPLIT_COUNT + "."
            );
        }

        int matchedStudentCount = request.matchedStudentCount() == null ? -1 : request.matchedStudentCount();
        if (matchedStudentCount < -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Matched student count cannot be negative.");
        }

        BigDecimal minCredits = request.minCredits();
        BigDecimal maxCredits = request.maxCredits();
        validateCreditRange(minCredits, maxCredits);

        return new NormalizedGenerationRequest(
                name,
                trimToNull(request.studentSearchText()),
                trimToNull(request.programSearchText()),
                normalizeGroupNamePrefix(request.groupNamePrefix()),
                normalizeOptionalId(request.academicDivisionId(), "Academic division id"),
                normalizeEnum(request.honorsFilter(), HONORS_ANY, Set.of(HONORS_ANY, HONORS_ONLY, HONORS_NOT), "Honors filter"),
                normalizeEnum(request.athleteFilter(), ATHLETE_ANY, Set.of(ATHLETE_ANY, ATHLETE_ONLY, ATHLETE_NOT), "Athlete filter"),
                normalizeSportIds(request.athleticSportIds()),
                normalizeEnum(request.existingGroupFilter(), GROUP_EXCLUDE, Set.of(GROUP_ANY, GROUP_EXCLUDE, GROUP_ONLY), "Existing group filter"),
                minCredits,
                maxCredits,
                request.includeCurrentCredits(),
                request.includeTransferCredits(),
                splitCount,
                matchedStudentCount
        );
    }

    private void validateCreditRange(BigDecimal minCredits, BigDecimal maxCredits) {
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
    }

    private Long normalizeOptionalId(Long id, String label) {
        if (id == null) {
            return null;
        }
        return requirePositiveId(id, label);
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

    private String normalizeGroupNamePrefix(String value) {
        String normalizedValue = trimToNull(value);
        if (normalizedValue == null) {
            return DEFAULT_GROUP_NAME_PREFIX;
        }
        validateMaxLength(normalizedValue, 255, "Group name prefix");
        return normalizedValue;
    }

    private List<Long> normalizeSportIds(List<Long> athleticSportIds) {
        if (athleticSportIds == null || athleticSportIds.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<Long> normalizedIds = new LinkedHashSet<>();
        athleticSportIds.forEach(athleticSportId ->
                normalizedIds.add(requirePositiveId(athleticSportId, "Athletic sport id"))
        );
        return List.copyOf(normalizedIds);
    }

    private List<NormalizedGroupRequest> normalizeGroups(
            List<RegistrationGroupGenerationCreateGroupRequest> groupRequests
    ) {
        if (groupRequests == null || groupRequests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one generated group is required.");
        }

        List<NormalizedGroupRequest> groups = new ArrayList<>();
        Set<Long> seenStudentIds = new HashSet<>();
        for (int index = 0; index < groupRequests.size(); index++) {
            RegistrationGroupGenerationCreateGroupRequest groupRequest = groupRequests.get(index);
            if (groupRequest == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generated group is required.");
            }

            String name = trimToNull(groupRequest.name());
            if (name == null) {
                name = "Registration Group " + (index + 1);
            }
            validateMaxLength(name, 255, "Group name");
            validateWindow(groupRequest.registrationOpensAt(), groupRequest.registrationClosesAt());

            List<Long> studentIds = normalizeStudentIds(groupRequest.studentIds(), seenStudentIds);
            groups.add(new NormalizedGroupRequest(
                    groupRequest.temporaryGroupId(),
                    name,
                    groupRequest.registrationOpensAt(),
                    groupRequest.registrationClosesAt(),
                    groupRequest.sortOrder() == null ? index : groupRequest.sortOrder(),
                    studentIds
            ));
        }
        return groups;
    }

    private void validateWindow(LocalDateTime registrationOpensAt, LocalDateTime registrationClosesAt) {
        if (registrationOpensAt != null
                && registrationClosesAt != null
                && !registrationOpensAt.isBefore(registrationClosesAt)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration opens at must be before registration closes at."
            );
        }
    }

    private List<Long> normalizeStudentIds(List<Long> studentIds, Set<Long> seenStudentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            return List.of();
        }

        List<Long> normalizedStudentIds = new ArrayList<>();
        for (Long studentId : studentIds) {
            Long normalizedStudentId = requirePositiveId(studentId, "Student id");
            if (!seenStudentIds.add(normalizedStudentId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A student can only be saved to one generated group."
                );
            }
            normalizedStudentIds.add(normalizedStudentId);
        }
        return List.copyOf(normalizedStudentIds);
    }

    private Map<Long, Student> loadStudents(List<NormalizedGroupRequest> groups) {
        List<Long> studentIds = groups.stream()
                .flatMap(group -> group.studentIds().stream())
                .distinct()
                .toList();
        if (studentIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Student> studentsById = studentRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));
        for (Long studentId : studentIds) {
            Student student = studentsById.get(studentId);
            if (student == null || student.isDisabled()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student " + studentId + " was not found.");
            }
        }
        return studentsById;
    }

    private void validateStudentsAreNotAlreadyAssignedToTerm(
            AcademicYear academicYear,
            AcademicTerm term,
            List<NormalizedGroupRequest> groups,
            Map<Long, Student> studentsById
    ) {
        List<Long> studentIds = groups.stream()
                .flatMap(group -> group.studentIds().stream())
                .distinct()
                .toList();
        if (studentIds.isEmpty()) {
            return;
        }

        List<RegistrationGroupStudent> existingAssignments =
                registrationGroupStudentRepository.findAssignmentsForStudentsInPeriod(
                        studentIds,
                        academicYear.getId(),
                        term.getId()
                );
        if (existingAssignments.isEmpty()) {
            return;
        }

        RegistrationGroupStudent existingAssignment = existingAssignments.getFirst();
        Student student = existingAssignment.getStudent();
        Student loadedStudent = student == null ? null : studentsById.getOrDefault(student.getId(), student);
        RegistrationGroup existingGroup = existingAssignment.getRegistrationGroup();
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                buildDisplayName(loadedStudent)
                        + " is already assigned to "
                        + existingGroup.getName()
                        + " for this academic year and term."
        );
    }

    private List<AthleticSport> loadSelectedSports(List<Long> athleticSportIds) {
        if (athleticSportIds.isEmpty()) {
            return List.of();
        }

        Map<Long, AthleticSport> activeSportsById = athleticSportRepository.findActiveForSelection().stream()
                .collect(Collectors.toMap(AthleticSport::getId, Function.identity()));
        List<AthleticSport> selectedSports = new ArrayList<>();
        for (Long athleticSportId : athleticSportIds) {
            AthleticSport athleticSport = activeSportsById.get(athleticSportId);
            if (athleticSport == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Athletic sport " + athleticSportId + " was not found."
                );
            }
            selectedSports.add(athleticSport);
        }
        return selectedSports;
    }

    private SisUser resolveActorUser(Long actorUserId) {
        if (actorUserId == null) {
            return null;
        }

        return sisUserRepository.findById(actorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User was not found."));
    }

    private String buildDisplayName(Student student) {
        String firstName = student == null ? null : student.getFirstName();
        String lastName = student == null ? null : student.getLastName();
        String displayName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        if (!displayName.isBlank()) {
            return displayName;
        }

        String email = student == null ? null : student.getEmail();
        return email == null ? "Student" : email;
    }

    private RegistrationGroupGeneration saveGeneration(
            NormalizedGenerationRequest request,
            AcademicYear academicYear,
            AcademicTerm term,
            SisUser actorUser,
            List<NormalizedGroupRequest> groups
    ) {
        RegistrationGroupGeneration generation = new RegistrationGroupGeneration();
        generation.setAcademicYear(academicYear);
        generation.setTerm(term);
        generation.setName(request.name());
        generation.setStudentSearchText(request.studentSearchText());
        generation.setProgramSearchText(request.programSearchText());
        generation.setGroupNamePrefix(request.groupNamePrefix());
        generation.setAcademicDivision(resolveAcademicDivision(request.academicDivisionId()));
        generation.setHonorsFilter(request.honorsFilter());
        generation.setAthleteFilter(request.athleteFilter());
        generation.setExistingGroupFilter(request.existingGroupFilter());
        generation.setMinCredits(request.minCredits());
        generation.setMaxCredits(request.maxCredits());
        generation.setIncludeCurrentCredits(request.includeCurrentCredits());
        generation.setIncludeTransferCredits(request.includeTransferCredits());
        generation.setSplitCount(request.splitCount());
        generation.setMatchedStudentCount(resolveMatchedStudentCount(request, groups));
        generation.setCreatedByUser(actorUser);
        generation.setUpdatedByUser(actorUser);
        return generationRepository.save(generation);
    }

    private AcademicDivision resolveAcademicDivision(Long academicDivisionId) {
        if (academicDivisionId == null) {
            return null;
        }

        AcademicDivision academicDivision = academicDivisionRepository.findById(academicDivisionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic division was not found."
                ));
        if (!academicDivision.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic division is not active.");
        }
        return academicDivision;
    }

    private int resolveMatchedStudentCount(
            NormalizedGenerationRequest request,
            List<NormalizedGroupRequest> groups
    ) {
        if (request.matchedStudentCount() >= 0) {
            return request.matchedStudentCount();
        }

        return (int) groups.stream()
                .flatMap(group -> group.studentIds().stream())
                .distinct()
                .count();
    }

    private void saveGenerationSports(
            RegistrationGroupGeneration generation,
            List<AthleticSport> selectedSports
    ) {
        if (selectedSports.isEmpty()) {
            return;
        }

        List<RegistrationGroupGenerationSport> generationSports = selectedSports.stream()
                .map(athleticSport -> {
                    RegistrationGroupGenerationSport generationSport = new RegistrationGroupGenerationSport();
                    generationSport.setRegistrationGroupGeneration(generation);
                    generationSport.setAthleticSport(athleticSport);
                    return generationSport;
                })
                .toList();
        generationSportRepository.saveAll(generationSports);
    }

    private List<RegistrationGroup> saveGroups(
            RegistrationGroupGeneration generation,
            AcademicYear academicYear,
            AcademicTerm term,
            List<NormalizedGroupRequest> groups,
            Map<Long, Student> studentsById,
            SisUser actorUser
    ) {
        List<RegistrationGroup> savedGroups = new ArrayList<>();
        Map<Long, List<RegistrationGroupStudent>> studentsByGroupId = new LinkedHashMap<>();

        for (NormalizedGroupRequest groupRequest : groups) {
            RegistrationGroup registrationGroup = new RegistrationGroup();
            registrationGroup.setRegistrationGroupGeneration(generation);
            registrationGroup.setAcademicYear(academicYear);
            registrationGroup.setTerm(term);
            registrationGroup.setName(groupRequest.name());
            registrationGroup.setStatus(DEFAULT_GROUP_STATUS);
            registrationGroup.setRegistrationOpensAt(groupRequest.registrationOpensAt());
            registrationGroup.setRegistrationClosesAt(groupRequest.registrationClosesAt());
            registrationGroup.setSortOrder(groupRequest.sortOrder());
            registrationGroup.setCreatedByUser(actorUser);
            registrationGroup.setUpdatedByUser(actorUser);

            RegistrationGroup savedGroup = registrationGroupRepository.save(registrationGroup);
            savedGroups.add(savedGroup);
            studentsByGroupId.put(savedGroup.getId(), buildStudentAssignments(savedGroup, groupRequest, studentsById, actorUser));
        }

        List<RegistrationGroupStudent> assignments = studentsByGroupId.values().stream()
                .flatMap(List::stream)
                .toList();
        if (!assignments.isEmpty()) {
            registrationGroupStudentRepository.saveAll(assignments);
        }
        return savedGroups;
    }

    private List<RegistrationGroupStudent> buildStudentAssignments(
            RegistrationGroup registrationGroup,
            NormalizedGroupRequest groupRequest,
            Map<Long, Student> studentsById,
            SisUser actorUser
    ) {
        return groupRequest.studentIds().stream()
                .map(studentId -> {
                    RegistrationGroupStudent assignment = new RegistrationGroupStudent();
                    assignment.setRegistrationGroup(registrationGroup);
                    assignment.setStudent(studentsById.get(studentId));
                    assignment.setAssignmentSource(ASSIGNMENT_SOURCE_GENERATED);
                    assignment.setCreatedByUser(actorUser);
                    assignment.setUpdatedByUser(actorUser);
                    return assignment;
                })
                .toList();
    }

    private RegistrationGroupGenerationCreateResponse toResponse(
            RegistrationGroupGeneration generation,
            List<RegistrationGroup> savedGroups,
            List<NormalizedGroupRequest> groups
    ) {
        AcademicYear academicYear = generation.getAcademicYear();
        AcademicTerm term = generation.getTerm();
        List<RegistrationGroupGenerationCreatedGroupResponse> groupResponses = new ArrayList<>();
        for (int index = 0; index < savedGroups.size(); index++) {
            RegistrationGroup registrationGroup = savedGroups.get(index);
            NormalizedGroupRequest group = groups.get(index);
            groupResponses.add(toGroupResponse(registrationGroup, group));
        }

        return new RegistrationGroupGenerationCreateResponse(
                generation.getId(),
                generation.getName(),
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                term.getId(),
                term.getCode(),
                term.getName(),
                generation.getMatchedStudentCount(),
                generation.getSplitCount(),
                savedGroups.size(),
                groupResponses
        );
    }

    private RegistrationGroupGenerationCreatedGroupResponse toGroupResponse(
            RegistrationGroup registrationGroup,
            NormalizedGroupRequest group
    ) {
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();

        return new RegistrationGroupGenerationCreatedGroupResponse(
                registrationGroup.getId(),
                group.temporaryGroupId(),
                registrationGroup.getName(),
                DEFAULT_GROUP_STATUS,
                "Draft",
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                term.getId(),
                term.getCode(),
                term.getName(),
                registrationGroup.getRegistrationOpensAt(),
                registrationGroup.getRegistrationClosesAt(),
                registrationGroup.getSortOrder(),
                group.studentIds().size()
        );
    }

    private record NormalizedGenerationRequest(
            String name,
            String studentSearchText,
            String programSearchText,
            String groupNamePrefix,
            Long academicDivisionId,
            String honorsFilter,
            String athleteFilter,
            List<Long> athleticSportIds,
            String existingGroupFilter,
            BigDecimal minCredits,
            BigDecimal maxCredits,
            boolean includeCurrentCredits,
            boolean includeTransferCredits,
            int splitCount,
            int matchedStudentCount
    ) {
    }

    private record NormalizedGroupRequest(
            String temporaryGroupId,
            String name,
            LocalDateTime registrationOpensAt,
            LocalDateTime registrationClosesAt,
            int sortOrder,
            List<Long> studentIds
    ) {
    }
}
