package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.program.StudentCompletionRequirementResponse;
import com.msm.sis.api.dto.student.program.StudentProgramCompletionRequirementResponse;
import com.msm.sis.api.dto.student.program.StudentProgramResponse;
import com.msm.sis.api.dto.student.program.StudentProgramsResponse;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanDraftRequest;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.DegreeType;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.ProgramVersionCompletionRequirement;
import com.msm.sis.api.entity.ProgramVersionCompletionRequirementOption;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentAcademicPlan;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.entity.StudentProgramRequest;
import com.msm.sis.api.mapper.StudentProgramTrackerMapper;
import com.msm.sis.api.repository.CourseVersionRepository;
import com.msm.sis.api.repository.ProgramVersionRequirementRepository;
import com.msm.sis.api.repository.ProgramVersionCompletionRequirementRepository;
import com.msm.sis.api.repository.RequirementCourseRepository;
import com.msm.sis.api.repository.RequirementCourseRuleRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import com.msm.sis.api.repository.StudentProgramRequestRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.RequirementGroupingUtils.collectRequirementIds;
import static com.msm.sis.api.util.RequirementGroupingUtils.groupRequirementCourseRulesByRequirementId;
import static com.msm.sis.api.util.RequirementGroupingUtils.groupRequirementCoursesByRequirementId;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentProgramTrackerService {
    private static final String COURSE_REUSE_POLICY_ALLOW_REUSE = "ALLOW_REUSE";
    private static final String SOURCE_REQUIREMENT_WAIVER = "TRANSFER_REQUIREMENT_WAIVER";
    private static final String PROGRAM_REQUIREMENT_STATUS_COMPLETED = "completed";
    private static final String PROGRAM_REQUIREMENT_STATUS_PLANNED = "planned";
    private static final String PROGRAM_REQUIREMENT_STATUS_NEEDED = "needed";
    private static final String STUDENT_PROGRAM_STATUS_EXPLORING = "EXPLORING";
    private static final String STUDENT_PROGRAM_STATUS_ACTIVE = "ACTIVE";
    private static final String STUDENT_PROGRAM_STATUS_COMPLETED = "COMPLETED";
    private static final List<String> VISIBLE_STUDENT_PROGRAM_STATUSES = List.of(
            STUDENT_PROGRAM_STATUS_EXPLORING,
            STUDENT_PROGRAM_STATUS_ACTIVE,
            STUDENT_PROGRAM_STATUS_COMPLETED
    );
    private static final String DEGREE_TYPE_MASTER = "MASTER";

    private final StudentRepository studentRepository;
    private final StudentProgramRepository studentProgramRepository;
    private final ProgramVersionRequirementRepository programVersionRequirementRepository;
    private final ProgramVersionCompletionRequirementRepository programVersionCompletionRequirementRepository;
    private final RequirementCourseRepository requirementCourseRepository;
    private final RequirementCourseRuleRepository requirementCourseRuleRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final StudentProgramRequestRepository studentProgramRequestRepository;
    private final StudentAcademicPlanService studentAcademicPlanService;
    private final StudentCompletedCourseTimelineService studentCompletedCourseTimelineService;
    private final StudentCourseEvidenceService studentCourseEvidenceService;
    private final StudentAcademicPlanWarningService studentAcademicPlanWarningService;
    private final StudentRequirementEvaluationService studentRequirementEvaluationService;
    private final StudentRequirementWaiverService studentRequirementWaiverService;
    private final RequirementProgressMath requirementProgressMath;
    private final StudentProgramTrackerMapper mapper;

    @Transactional
    public StudentProgramsResponse getProgramsForStudent(Long studentId) {
        requirePositiveId(studentId, "Student id");
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        StudentAcademicPlan activePlan = studentAcademicPlanService.getOrCreateActivePlanEntity(studentId);
        return buildProgramsForStudent(student, activePlan);
    }

    @Transactional(readOnly = true)
    public StudentProgramsResponse getProgramsForStudentReadOnly(Long studentId) {
        requirePositiveId(studentId, "Student id");
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        StudentAcademicPlan activePlan = studentAcademicPlanService.getActivePlanOrDefaultProjection(studentId);
        return buildProgramsForStudent(student, activePlan);
    }

    @Transactional(readOnly = true)
    public StudentProgramsResponse previewProgramsForStudent(
            Long studentId,
            StudentAcademicPlanDraftRequest request
    ) {
        requirePositiveId(studentId, "Student id");
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        StudentAcademicPlan draftPlan = studentAcademicPlanService.buildDraftPlan(studentId, request);
        return buildProgramsForStudent(student, draftPlan);
    }

    @Transactional(readOnly = true)
    public StudentProgramsResponse previewProgramsForAuthenticatedStudent(
            Long userId,
            StudentAcademicPlanDraftRequest request
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        return previewProgramsForStudent(student.getId(), request);
    }

    private StudentProgramsResponse buildProgramsForStudent(
            Student student,
            StudentAcademicPlan academicPlan
    ) {
        Long studentId = student.getId();
        List<StudentProgram> studentPrograms = studentProgramRepository.findForStudentByStatuses(
                studentId,
                VISIBLE_STUDENT_PROGRAM_STATUSES
        );
        Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByRequirementId =
                groupPlannedCoursesByRequirementId(academicPlan);
        List<StudentCourseEvidence> completedEvidence = studentCourseEvidenceService.findCompletedCourseEvidence(studentId);

        Map<Long, List<ProgramVersionRequirement>> requirementsByProgramVersionId =
                buildRequirementsByProgramVersionId(studentPrograms);
        Map<Long, List<ProgramVersionCompletionRequirement>> completionRequirementsByProgramVersionId =
                buildCompletionRequirementsByProgramVersionId(studentPrograms);
        List<Long> requirementIds = collectRequirementIds(requirementsByProgramVersionId);
        Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId =
                groupRequirementCoursesByRequirementId(findRequirementCourses(requirementIds));
        Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId =
                groupRequirementCourseRulesByRequirementId(findRequirementCourseRules(requirementIds));
        Map<Long, CourseVersion> currentCourseVersionsByCourseId =
                buildCurrentCourseVersionsByCourseId(requirementCoursesByRequirementId);
        ProgramRequestLookup requestLookup = buildRequestLookup(studentPrograms);
        StudentRequirementWaiverService.StudentRequirementWaiverLookup requirementWaiverLookup =
                studentRequirementWaiverService.findApprovedRequirementWaivers(studentId);

        List<StudentProgramResponse> programResponses = studentPrograms.stream()
                .map(studentProgram -> toStudentProgramResponse(
                        studentProgram,
                        requirementsByProgramVersionId,
                        requirementCoursesByRequirementId,
                        requirementCourseRulesByRequirementId,
                        currentCourseVersionsByCourseId,
                        plannedCoursesByRequirementId,
                        completedEvidence,
                        completionRequirementsByProgramVersionId,
                        studentPrograms,
                        requestLookup.findFor(studentProgram),
                        requirementWaiverLookup
                ))
                .toList();

        return mapper.toStudentProgramsResponse(
                student.getId(),
                showSubtermPlanner(studentPrograms),
                programResponses,
                mapper.toStudentAcademicPlanResponse(
                        academicPlan,
                        studentAcademicPlanWarningService.buildWarnings(student.getId(), academicPlan),
                        studentCompletedCourseTimelineService.getCompletedLocalCourseTimeline(student.getId())
                )
        );
    }

    private boolean showSubtermPlanner(List<StudentProgram> studentPrograms) {
        return studentPrograms.stream()
                .map(StudentProgram::getProgram)
                .filter(Objects::nonNull)
                .map(Program::getDegreeType)
                .filter(Objects::nonNull)
                .map(DegreeType::getCode)
                .filter(Objects::nonNull)
                .anyMatch(code -> DEGREE_TYPE_MASTER.equalsIgnoreCase(code));
    }

    private ProgramRequestLookup buildRequestLookup(List<StudentProgram> studentPrograms) {
        List<Long> studentProgramIds = studentPrograms.stream()
                .map(StudentProgram::getId)
                .filter(Objects::nonNull)
                .toList();
        if (studentProgramIds.isEmpty()) {
            return new ProgramRequestLookup(Map.of(), Map.of());
        }

        List<StudentProgramRequest> requests = studentProgramRequestRepository
                .findRequestsForStudentPrograms(studentProgramIds);
        Map<Long, StudentProgramRequest> requestsByStudentProgramId = requests.stream()
                .filter(request -> request.getStudentProgram() != null && request.getStudentProgram().getId() != null)
                .collect(Collectors.toMap(
                        request -> request.getStudentProgram().getId(),
                        Function.identity(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));
        Map<Long, StudentProgramRequest> requestsByProgramId = requests.stream()
                .filter(request -> request.getProgram() != null && request.getProgram().getId() != null)
                .collect(Collectors.toMap(
                        request -> request.getProgram().getId(),
                        Function.identity(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));

        return new ProgramRequestLookup(requestsByStudentProgramId, requestsByProgramId);
    }

    public StudentProgramsResponse getProgramsForAuthenticatedStudent(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        return getProgramsForStudent(student.getId());
    }

    private StudentProgramResponse toStudentProgramResponse(
            StudentProgram studentProgram,
            Map<Long, List<ProgramVersionRequirement>> requirementsByProgramVersionId,
            Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId,
            Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId,
            Map<Long, CourseVersion> currentCourseVersionsByCourseId,
            Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByRequirementId,
            List<StudentCourseEvidence> completedEvidence,
            Map<Long, List<ProgramVersionCompletionRequirement>> completionRequirementsByProgramVersionId,
            List<StudentProgram> activeStudentPrograms,
            StudentProgramRequest openRequest,
            StudentRequirementWaiverService.StudentRequirementWaiverLookup requirementWaiverLookup
    ) {
        Long programVersionId = studentProgram.getProgramVersion() == null
                ? null
                : studentProgram.getProgramVersion().getId();
        StudentCompletionRequirementClaimTracker claimTracker = new StudentCompletionRequirementClaimTracker();
        List<StudentCompletionRequirementResponse> requirementResponses =
                requirementsByProgramVersionId.getOrDefault(programVersionId, List.of()).stream()
                        .map(programVersionRequirement -> {
                            Requirement requirement = programVersionRequirement.getRequirement();
                            Long requirementId = requirement == null ? null : requirement.getId();
                            StudentCompletionRequirementClaimTracker effectiveClaimTracker =
                                    allowsCourseReuse(programVersionRequirement)
                                            ? new StudentCompletionRequirementClaimTracker()
                                            : claimTracker;
                            StudentRequirementEvaluationResult evaluationResult = evaluateRequirement(
                                    programVersionRequirement,
                                    requirementCoursesByRequirementId.getOrDefault(requirementId, List.of()),
                                    requirementCourseRulesByRequirementId.getOrDefault(requirementId, List.of()),
                                    completedEvidence,
                                    plannedCoursesByRequirementId.getOrDefault(requirementId, List.of()),
                                    effectiveClaimTracker,
                                    requirementWaiverLookup.findFor(programVersionRequirement)
                            );
                            return mapper.toStudentCompletionRequirementResponse(
                                    programVersionRequirement,
                                    requirementCoursesByRequirementId.getOrDefault(requirementId, List.of()),
                                    requirementCourseRulesByRequirementId.getOrDefault(requirementId, List.of()),
                                    currentCourseVersionsByCourseId,
                                    evaluationResult
                            );
                        })
                        .toList();

        List<StudentProgramCompletionRequirementResponse> completionRequirementResponses =
                completionRequirementsByProgramVersionId.getOrDefault(programVersionId, List.of()).stream()
                        .map(completionRequirement -> toStudentProgramCompletionRequirementResponse(
                                studentProgram,
                                completionRequirement,
                                activeStudentPrograms
                        ))
                        .toList();

        return mapper.toStudentProgramResponse(
                studentProgram,
                requirementResponses,
                completionRequirementResponses,
                openRequest
        );
    }

    private boolean allowsCourseReuse(ProgramVersionRequirement programVersionRequirement) {
        return COURSE_REUSE_POLICY_ALLOW_REUSE.equals(programVersionRequirement.getCourseReusePolicy());
    }

    private StudentRequirementEvaluationResult evaluateRequirement(
            ProgramVersionRequirement programVersionRequirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules,
            List<StudentCourseEvidence> completedEvidence,
            List<StudentAcademicPlanCourse> plannedCourses,
            StudentCompletionRequirementClaimTracker claimTracker,
            StudentRequirementWaiver waiver
    ) {
        Requirement requirement = programVersionRequirement.getRequirement();
        if (waiver == null) {
            return studentRequirementEvaluationService.evaluate(
                    requirement,
                    requirementCourses,
                    requirementCourseRules,
                    completedEvidence,
                    plannedCourses,
                    claimTracker
            );
        }

        return waivedEvaluationResult(requirement, requirementCourses, requirementCourseRules, waiver);
    }

    private StudentRequirementEvaluationResult waivedEvaluationResult(
            Requirement requirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules,
            StudentRequirementWaiver waiver
    ) {
        String requirementType = requirement == null ? null : requirement.getRequirementType();
        String progressUnit = "DEPARTMENT_LEVEL_COURSES".equals(requirementType)
                ? requirementProgressMath.progressUnit(requirement, requirementCourseRules)
                : requirementProgressMath.progressUnit(requirement);
        java.math.BigDecimal required = requiredValue(requirement, requirementCourses, requirementCourseRules);
        java.math.BigDecimal completed = required.compareTo(java.math.BigDecimal.ZERO) > 0
                ? required
                : java.math.BigDecimal.ONE;

        return new StudentRequirementEvaluationResult(
                completed,
                java.math.BigDecimal.ZERO,
                required,
                progressUnit,
                Map.of(),
                List.of(new StudentRequirementMatchedCourse(
                        null,
                        "Requirement waiver",
                        waiver.notes(),
                        waiver.acceptedCredits(),
                        PROGRAM_REQUIREMENT_STATUS_COMPLETED,
                        SOURCE_REQUIREMENT_WAIVER,
                        waiver.transferRequestOutcomeId(),
                        null,
                        null,
                        null
                ))
        );
    }

    private java.math.BigDecimal requiredValue(
            Requirement requirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules
    ) {
        if (requirement == null) {
            return java.math.BigDecimal.ZERO;
        }

        return switch (requirement.getRequirementType() == null ? "" : requirement.getRequirementType()) {
            case "SPECIFIC_COURSES" -> requirementProgressMath.requiredValueForRequirementCourses(
                    requirement,
                    requirementCourses
            );
            case "DEPARTMENT_LEVEL_COURSES" -> requirementProgressMath.requiredValueForRequirementCourseRules(
                    requirement,
                    requirementCourseRules
            );
            default -> requirementProgressMath.requiredValue(requirement);
        };
    }

    private record ProgramRequestLookup(
            Map<Long, StudentProgramRequest> requestsByStudentProgramId,
            Map<Long, StudentProgramRequest> requestsByProgramId
    ) {
        private StudentProgramRequest findFor(StudentProgram studentProgram) {
            StudentProgramRequest request = requestsByStudentProgramId.get(studentProgram.getId());
            if (request != null) {
                return request;
            }

            Program program = studentProgram.getProgram();
            return program == null ? null : requestsByProgramId.get(program.getId());
        }
    }

    private StudentProgramCompletionRequirementResponse toStudentProgramCompletionRequirementResponse(
            StudentProgram currentStudentProgram,
            ProgramVersionCompletionRequirement completionRequirement,
            List<StudentProgram> activeStudentPrograms
    ) {
        Map<Long, Integer> matchedCountsByOptionId = new LinkedHashMap<>();
        Map<Long, Integer> completedCountsByOptionId = new LinkedHashMap<>();
        Map<Long, Integer> plannedCountsByOptionId = new LinkedHashMap<>();
        Map<Long, String> statusesByOptionId = new LinkedHashMap<>();
        List<StudentProgram> matchedStudentPrograms = completionRequirement.getOptions().stream()
                .flatMap(option -> {
                    List<StudentProgram> matches = matchingStudentPrograms(
                            currentStudentProgram,
                            option,
                            activeStudentPrograms
                    );
                    int completedCount = countCompletedPrograms(matches);
                    int plannedCount = matches.size() - completedCount;
                    matchedCountsByOptionId.put(option.getId(), matches.size());
                    completedCountsByOptionId.put(option.getId(), completedCount);
                    plannedCountsByOptionId.put(option.getId(), plannedCount);
                    statusesByOptionId.put(option.getId(), completionRequirementStatus(
                            completedCount,
                            plannedCount,
                            1
                    ));
                    return matches.stream();
                })
                .toList();
        Map<Long, StudentProgram> matchedStudentProgramsById = matchedStudentPrograms.stream()
                .filter(studentProgram -> studentProgram.getId() != null)
                .collect(Collectors.toMap(
                        StudentProgram::getId,
                        Function.identity(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));
        int completedCount = countCompletedPrograms(matchedStudentProgramsById.values().stream().toList());
        int matchedCount = matchedStudentProgramsById.size();
        int plannedCount = matchedCount - completedCount;
        int minimumCount = completionRequirement.getMinimumCount() == null
                ? 1
                : completionRequirement.getMinimumCount();
        String status = completionRequirementStatus(completedCount, plannedCount, minimumCount);

        return mapper.toStudentProgramCompletionRequirementResponse(
                completionRequirement,
                PROGRAM_REQUIREMENT_STATUS_COMPLETED.equals(status),
                matchedCount,
                completedCount,
                plannedCount,
                status,
                matchedCountsByOptionId,
                completedCountsByOptionId,
                plannedCountsByOptionId,
                statusesByOptionId
        );
    }

    private int countCompletedPrograms(List<StudentProgram> studentPrograms) {
        return (int) studentPrograms.stream()
                .filter(this::isCompletedProgram)
                .count();
    }

    private boolean isCompletedProgram(StudentProgram studentProgram) {
        return studentProgram.getCompletedDate() != null
                || STUDENT_PROGRAM_STATUS_COMPLETED.equalsIgnoreCase(studentProgram.getStatus());
    }

    private String completionRequirementStatus(
            int completedCount,
            int plannedCount,
            int minimumCount
    ) {
        if (completedCount >= minimumCount) {
            return PROGRAM_REQUIREMENT_STATUS_COMPLETED;
        }

        if (completedCount + plannedCount >= minimumCount) {
            return PROGRAM_REQUIREMENT_STATUS_PLANNED;
        }

        return PROGRAM_REQUIREMENT_STATUS_NEEDED;
    }

    private List<StudentProgram> matchingStudentPrograms(
            StudentProgram currentStudentProgram,
            ProgramVersionCompletionRequirementOption option,
            List<StudentProgram> activeStudentPrograms
    ) {
        return activeStudentPrograms.stream()
                .filter(candidate -> !Objects.equals(candidate.getId(), currentStudentProgram.getId()))
                .filter(candidate -> matchesCompletionRequirementOption(candidate, option))
                .toList();
    }

    private boolean matchesCompletionRequirementOption(
            StudentProgram candidate,
            ProgramVersionCompletionRequirementOption option
    ) {
        if (option.getRequiredProgramType() != null) {
            return candidate.getProgram() != null
                    && candidate.getProgram().getProgramType() != null
                    && Objects.equals(
                    candidate.getProgram().getProgramType().getId(),
                    option.getRequiredProgramType().getId()
            );
        }

        if (option.getRequiredProgram() != null) {
            return candidate.getProgram() != null
                    && Objects.equals(candidate.getProgram().getId(), option.getRequiredProgram().getId());
        }

        if (option.getRequiredProgramVersion() != null) {
            return candidate.getProgramVersion() != null
                    && Objects.equals(candidate.getProgramVersion().getId(), option.getRequiredProgramVersion().getId());
        }

        return false;
    }

    private Map<Long, List<ProgramVersionRequirement>> buildRequirementsByProgramVersionId(
            List<StudentProgram> studentPrograms
    ) {
        Map<Long, List<ProgramVersionRequirement>> requirementsByProgramVersionId = new LinkedHashMap<>();
        studentPrograms.forEach(studentProgram -> {
            if (studentProgram.getProgramVersion() != null) {
                Long programVersionId = studentProgram.getProgramVersion().getId();
                requirementsByProgramVersionId.put(
                        programVersionId,
                        programVersionRequirementRepository.findRequirementsForVersion(programVersionId)
                );
            }
        });
        return requirementsByProgramVersionId;
    }

    private Map<Long, List<ProgramVersionCompletionRequirement>> buildCompletionRequirementsByProgramVersionId(
            List<StudentProgram> studentPrograms
    ) {
        Map<Long, List<ProgramVersionCompletionRequirement>> completionRequirementsByProgramVersionId = new LinkedHashMap<>();
        studentPrograms.forEach(studentProgram -> {
            if (studentProgram.getProgramVersion() != null) {
                Long programVersionId = studentProgram.getProgramVersion().getId();
                completionRequirementsByProgramVersionId.put(
                        programVersionId,
                        programVersionCompletionRequirementRepository.findCompletionRequirementsForVersion(programVersionId)
                );
            }
        });
        return completionRequirementsByProgramVersionId;
    }

    private List<RequirementCourse> findRequirementCourses(List<Long> requirementIds) {
        if (requirementIds.isEmpty()) {
            return List.of();
        }

        return requirementCourseRepository.findCoursesForRequirements(requirementIds);
    }

    private List<RequirementCourseRule> findRequirementCourseRules(List<Long> requirementIds) {
        if (requirementIds.isEmpty()) {
            return List.of();
        }

        return requirementCourseRuleRepository.findRulesForRequirements(requirementIds);
    }

    private Map<Long, CourseVersion> buildCurrentCourseVersionsByCourseId(
            Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId
    ) {
        List<Long> courseIds = requirementCoursesByRequirementId.values().stream()
                .flatMap(List::stream)
                .map(RequirementCourse::getCourse)
                .filter(Objects::nonNull)
                .map(course -> course.getId())
                .distinct()
                .toList();

        if (courseIds.isEmpty()) {
            return Map.of();
        }

        return courseVersionRepository.findCurrentCourseVersionsByCourseIds(courseIds)
                .stream()
                .collect(Collectors.toMap(
                        courseVersion -> courseVersion.getCourse().getId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));
    }

    private Map<Long, List<StudentAcademicPlanCourse>> groupPlannedCoursesByRequirementId(
            StudentAcademicPlan academicPlan
    ) {
        return academicPlan.getYears().stream()
                .flatMap(year -> year.getTerms().stream())
                .flatMap(term -> term.getCourses().stream())
                .filter(planCourse -> planCourse.getRequirement() != null)
                .collect(Collectors.groupingBy(planCourse -> planCourse.getRequirement().getId()));
    }

}
