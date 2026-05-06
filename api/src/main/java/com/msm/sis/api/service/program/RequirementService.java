package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.AttachProgramVersionRequirementRequest;
import com.msm.sis.api.dto.program.CreateProgramVersionCompletionRequirementOptionRequest;
import com.msm.sis.api.dto.program.CreateProgramVersionCompletionRequirementRequest;
import com.msm.sis.api.dto.program.CreateRequirementRequest;
import com.msm.sis.api.dto.program.PatchProgramVersionRequirementRequest;
import com.msm.sis.api.dto.program.PatchProgramVersionCompletionRequirementOptionRequest;
import com.msm.sis.api.dto.program.PatchProgramVersionCompletionRequirementRequest;
import com.msm.sis.api.dto.program.PatchRequirementRequest;
import com.msm.sis.api.dto.program.ProgramVersionCompletionRequirementResponse;
import com.msm.sis.api.dto.program.ProgramVersionRequirementResponse;
import com.msm.sis.api.dto.program.RequirementDetailResponse;
import com.msm.sis.api.dto.program.RequirementSearchCriteria;
import com.msm.sis.api.dto.program.RequirementSearchResponse;
import com.msm.sis.api.dto.program.RequirementSearchResultResponse;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRequest;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRuleRequest;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.entity.ProgramVersionCompletionRequirement;
import com.msm.sis.api.entity.ProgramVersionCompletionRequirementOption;
import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.mapper.ProgramMapper;
import com.msm.sis.api.mapper.RequirementMapper;
import com.msm.sis.api.repository.ProgramRepository;
import com.msm.sis.api.repository.ProgramTypeRepository;
import com.msm.sis.api.repository.ProgramVersionRepository;
import com.msm.sis.api.repository.ProgramVersionCompletionRequirementRepository;
import com.msm.sis.api.repository.ProgramVersionRequirementRepository;
import com.msm.sis.api.repository.RequirementCourseRepository;
import com.msm.sis.api.repository.RequirementCourseRuleRepository;
import com.msm.sis.api.repository.RequirementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.containsIgnoreCase;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class RequirementService {
    private static final String TOTAL_ELECTIVE_CREDITS = "TOTAL_ELECTIVE_CREDITS";
    private static final String SPECIFIC_COURSES = "SPECIFIC_COURSES";
    private static final String DEPARTMENT_LEVEL_COURSES = "DEPARTMENT_LEVEL_COURSES";
    private static final String MANUAL = "MANUAL";

    private final RequirementComponentService requirementComponentService;
    private final RequirementMapper requirementMapper;
    private final ProgramMapper programMapper;
    private final ProgramRepository programRepository;
    private final ProgramTypeRepository programTypeRepository;
    private final ProgramVersionRepository programVersionRepository;
    private final ProgramVersionCompletionRequirementRepository programVersionCompletionRequirementRepository;
    private final ProgramVersionRequirementRepository programVersionRequirementRepository;
    private final RequirementRepository requirementRepository;
    private final RequirementCourseRepository requirementCourseRepository;
    private final RequirementCourseRuleRepository requirementCourseRuleRepository;
    private final RequirementShapeValidationService requirementShapeValidationService;
    private final RequirementValidationService requirementValidationService;

    @Transactional(readOnly = true)
    public RequirementSearchResponse searchRequirements(
            RequirementSearchCriteria criteria,
            int page,
            int size
    ) {
        requirementValidationService.validatePageRequest(page, size);

        RequirementSearchCriteria effectiveCriteria = criteria == null ? new RequirementSearchCriteria() : criteria;
        List<Requirement> filteredRequirements = requirementRepository.findRequirementsByName().stream()
                .filter(requirement -> containsIgnoreCase(requirement.getCode(), effectiveCriteria.getCode()))
                .filter(requirement -> containsIgnoreCase(requirement.getName(), effectiveCriteria.getName()))
                .filter(requirement -> matchesRequirementType(requirement, effectiveCriteria.getRequirementType()))
                .sorted(Comparator.comparing(Requirement::getName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Requirement::getCode, String.CASE_INSENSITIVE_ORDER))
                .toList();

        long totalElements = filteredRequirements.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, filteredRequirements.size());
        int toIndex = Math.min(fromIndex + size, filteredRequirements.size());

        List<RequirementSearchResultResponse> results = filteredRequirements.subList(fromIndex, toIndex)
                .stream()
                .map(this::mapRequirementSearchResultResponse)
                .toList();

        return new RequirementSearchResponse(results, page, size, totalElements, totalPages);
    }

    @Transactional(readOnly = true)
    public RequirementDetailResponse getRequirementDetail(Long requirementId) {
        Requirement requirement = findRequirement(requirementId);
        List<Long> requirementIds = List.of(requirement.getId());

        return requirementMapper.toRequirementDetailResponse(
                requirement,
                requirementCourseRepository.findCoursesForRequirements(requirementIds),
                requirementCourseRuleRepository.findRulesForRequirements(requirementIds)
        );
    }

    @Transactional
    public RequirementSearchResultResponse createRequirement(CreateRequirementRequest request) {
        requirementValidationService.validateCreateRequirementRequest(request);
        requirementShapeValidationService.validateRequirementShape(
                request.requirementType(),
                request.minimumCredits(),
                request.minimumCourses(),
                request.courseMatchMode(),
                request.minimumGrade(),
                request.requirementCourses(),
                request.requirementCourseRules()
        );
        String code = request.code().trim();
        requirementValidationService.validateRequirementCodeAvailable(code);

        Requirement requirement = new Requirement();
        requirement.setCode(code);
        requirement.setName(request.name().trim());
        requirement.setRequirementType(request.requirementType().trim());
        requirement.setDescription(trimToNull(request.description()));
        requirement.setMinimumCredits(request.minimumCredits());
        requirement.setMinimumCourses(request.minimumCourses());
        requirement.setCourseMatchMode(trimToNull(request.courseMatchMode()));
        requirement.setMinimumGrade(trimToNull(request.minimumGrade()));
        normalizeRequirementFieldsForType(requirement);

        Requirement savedRequirement = requirementRepository.save(requirement);
        requirementComponentService.replaceRequirementCourses(savedRequirement, request.requirementCourses());
        requirementComponentService.replaceRequirementCourseRules(savedRequirement, request.requirementCourseRules());

        return mapRequirementSearchResultResponse(savedRequirement);
    }

    @Transactional
    public RequirementSearchResultResponse patchRequirement(Long requirementId, PatchRequirementRequest request) {
        requireRequestBody(request);

        Requirement requirement = findRequirement(requirementId);
        applyRequirementPatch(requirement, request);
        normalizeRequirementFieldsForType(requirement);
        requirementShapeValidationService.validateRequirementShape(
                requirement.getRequirementType(),
                requirement.getMinimumCredits(),
                requirement.getMinimumCourses(),
                requirement.getCourseMatchMode(),
                requirement.getMinimumGrade(),
                effectiveRequirementCourses(requirement, request),
                effectiveRequirementCourseRules(requirement, request)
        );

        Requirement savedRequirement = requirementRepository.save(requirement);

        if (request.requirementCourses() != null) {
            requirementComponentService.replaceRequirementCourses(savedRequirement, request.requirementCourses());
        }

        if (request.requirementCourseRules() != null) {
            requirementComponentService.replaceRequirementCourseRules(savedRequirement, request.requirementCourseRules());
        }

        return mapRequirementSearchResultResponse(savedRequirement);
    }

    @Transactional
    public ProgramVersionRequirementResponse attachRequirementToProgramVersion(
            Long programVersionId,
            AttachProgramVersionRequirementRequest request
    ) {
        requireRequestBody(request);

        ProgramVersion programVersion = programVersionRepository.findById(programVersionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program version was not found."));
        Requirement requirement = findRequirement(request.requirementId());

        requirementValidationService.validateRequirementAssignmentAvailable(programVersionId, requirement.getId());

        ProgramVersionRequirement assignment = new ProgramVersionRequirement();
        assignment.setProgramVersion(programVersion);
        assignment.setRequirement(requirement);
        assignment.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        assignment.setRequired(true);
        assignment.setCourseReusePolicy(request.courseReusePolicy() == null
                ? "CONSUME_AVAILABLE"
                : request.courseReusePolicy());
        assignment.setNotes(trimToNull(request.notes()));

        return mapProgramVersionRequirementResponse(programVersionRequirementRepository.save(assignment));
    }

    @Transactional
    public ProgramVersionRequirementResponse patchProgramVersionRequirement(
            Long programVersionRequirementId,
            PatchProgramVersionRequirementRequest request
    ) {
        requireRequestBody(request);

        ProgramVersionRequirement assignment = programVersionRequirementRepository.findById(programVersionRequirementId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Program version requirement was not found."
                ));

        if (request.sortOrder() != null) {
            assignment.setSortOrder(request.sortOrder());
        }

        if (request.notes() != null) {
            assignment.setNotes(trimToNull(request.notes()));
        }

        if (request.courseReusePolicy() != null) {
            assignment.setCourseReusePolicy(request.courseReusePolicy());
        }

        return mapProgramVersionRequirementResponse(programVersionRequirementRepository.save(assignment));
    }

    @Transactional
    public void removeProgramVersionRequirement(Long programVersionRequirementId) {
        ProgramVersionRequirement assignment = programVersionRequirementRepository.findById(programVersionRequirementId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Program version requirement was not found."
                ));

        programVersionRequirementRepository.delete(assignment);
    }

    @Transactional
    public ProgramVersionCompletionRequirementResponse createProgramVersionCompletionRequirement(
            Long programVersionId,
            CreateProgramVersionCompletionRequirementRequest request
    ) {
        requireRequestBody(request);
        validateCompletionRequirementOptions(request.options());

        ProgramVersion programVersion = programVersionRepository.findById(programVersionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program version was not found."));

        ProgramVersionCompletionRequirement completionRequirement = new ProgramVersionCompletionRequirement();
        completionRequirement.setProgramVersion(programVersion);
        completionRequirement.setMinimumCount(request.minimumCount() == null ? 1 : request.minimumCount());
        completionRequirement.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        completionRequirement.setNotes(trimToNull(request.notes()));
        request.options().forEach(optionRequest ->
                completionRequirement.getOptions().add(toCompletionRequirementOption(completionRequirement, optionRequest))
        );

        return mapProgramVersionCompletionRequirementResponse(
                programVersionCompletionRequirementRepository.save(completionRequirement)
        );
    }

    @Transactional
    public ProgramVersionCompletionRequirementResponse patchProgramVersionCompletionRequirement(
            Long programVersionCompletionRequirementId,
            PatchProgramVersionCompletionRequirementRequest request
    ) {
        requireRequestBody(request);

        ProgramVersionCompletionRequirement completionRequirement = findCompletionRequirement(programVersionCompletionRequirementId);

        if (request.minimumCount() != null) {
            completionRequirement.setMinimumCount(request.minimumCount());
        }

        if (request.sortOrder() != null) {
            completionRequirement.setSortOrder(request.sortOrder());
        }

        if (request.notes() != null) {
            completionRequirement.setNotes(trimToNull(request.notes()));
        }

        if (request.options() != null) {
            validatePatchCompletionRequirementOptions(request.options());
            completionRequirement.getOptions().clear();
            request.options().forEach(optionRequest ->
                    completionRequirement.getOptions().add(toCompletionRequirementOption(completionRequirement, optionRequest))
            );
        }

        return mapProgramVersionCompletionRequirementResponse(
                programVersionCompletionRequirementRepository.save(completionRequirement)
        );
    }

    @Transactional
    public void removeProgramVersionCompletionRequirement(Long programVersionCompletionRequirementId) {
        ProgramVersionCompletionRequirement completionRequirement = findCompletionRequirement(programVersionCompletionRequirementId);
        programVersionCompletionRequirementRepository.delete(completionRequirement);
    }

    private void applyRequirementPatch(Requirement requirement, PatchRequirementRequest request) {
        if (request.code() != null) {
            String code = trimToNull(request.code());
            if (code == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement code cannot be blank.");
            }

            requirementValidationService.validateRequirementCodeAvailableForPatch(requirement, code);
            requirement.setCode(code);
        }

        if (request.name() != null) {
            String name = trimToNull(request.name());
            if (name == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement name cannot be blank.");
            }
            requirement.setName(name);
        }

        if (request.requirementType() != null) {
            requirement.setRequirementType(request.requirementType().trim());
        }

        if (request.description() != null) {
            requirement.setDescription(trimToNull(request.description()));
        }

        if (request.minimumCredits() != null) {
            requirement.setMinimumCredits(request.minimumCredits());
        }

        if (request.minimumCourses() != null) {
            requirement.setMinimumCourses(request.minimumCourses());
        }

        if (request.courseMatchMode() != null) {
            requirement.setCourseMatchMode(trimToNull(request.courseMatchMode()));
        }

        if (request.minimumGrade() != null) {
            requirement.setMinimumGrade(trimToNull(request.minimumGrade()));
        }
    }

    private void normalizeRequirementFieldsForType(Requirement requirement) {
        String requirementType = trimToNull(requirement.getRequirementType());

        if (requirementType == null) {
            return;
        }

        switch (requirementType) {
            case TOTAL_ELECTIVE_CREDITS -> {
                requirement.setMinimumCourses(null);
                requirement.setCourseMatchMode(null);
            }
            case SPECIFIC_COURSES -> requirement.setMinimumCredits(null);
            case DEPARTMENT_LEVEL_COURSES, MANUAL -> {
                requirement.setMinimumCredits(null);
                requirement.setMinimumCourses(null);
                requirement.setCourseMatchMode(null);
            }
            default -> {
            }
        }
    }

    private List<UpsertRequirementCourseRequest> effectiveRequirementCourses(
            Requirement requirement,
            PatchRequirementRequest request
    ) {
        if (request.requirementCourses() != null) {
            return request.requirementCourses();
        }

        return requirementCourseRepository.findCoursesForRequirements(List.of(requirement.getId()))
                .stream()
                .map(this::toUpsertRequirementCourseRequest)
                .toList();
    }

    private List<UpsertRequirementCourseRuleRequest> effectiveRequirementCourseRules(
            Requirement requirement,
            PatchRequirementRequest request
    ) {
        if (request.requirementCourseRules() != null) {
            return request.requirementCourseRules();
        }

        return requirementCourseRuleRepository.findRulesForRequirements(List.of(requirement.getId()))
                .stream()
                .map(this::toUpsertRequirementCourseRuleRequest)
                .toList();
    }

    private UpsertRequirementCourseRequest toUpsertRequirementCourseRequest(RequirementCourse requirementCourse) {
        return new UpsertRequirementCourseRequest(
                requirementCourse.getCourse() == null ? null : requirementCourse.getCourse().getId(),
                requirementCourse.getMinimumGrade()
        );
    }

    private UpsertRequirementCourseRuleRequest toUpsertRequirementCourseRuleRequest(
            RequirementCourseRule requirementCourseRule
    ) {
        return new UpsertRequirementCourseRuleRequest(
                requirementCourseRule.getDepartment() == null ? null : requirementCourseRule.getDepartment().getId(),
                requirementCourseRule.getMinimumCourseNumber(),
                requirementCourseRule.getMaximumCourseNumber(),
                requirementCourseRule.getMinimumCredits(),
                requirementCourseRule.getMinimumCourses(),
                requirementCourseRule.getMinimumGrade()
        );
    }

    private ProgramVersionRequirementResponse mapProgramVersionRequirementResponse(
            ProgramVersionRequirement assignment
    ) {
        Long requirementId = assignment.getRequirement() == null ? null : assignment.getRequirement().getId();

        if (requirementId == null) {
            return requirementMapper.toProgramVersionRequirementResponse(assignment, List.of(), List.of());
        }

        return requirementMapper.toProgramVersionRequirementResponse(
                assignment,
                requirementCourseRepository.findCoursesForRequirements(List.of(requirementId)),
                requirementCourseRuleRepository.findRulesForRequirements(List.of(requirementId))
        );
    }

    private ProgramVersionCompletionRequirementResponse mapProgramVersionCompletionRequirementResponse(
            ProgramVersionCompletionRequirement completionRequirement
    ) {
        return programMapper.toProgramVersionCompletionRequirementResponse(completionRequirement);
    }

    private ProgramVersionCompletionRequirement findCompletionRequirement(Long programVersionCompletionRequirementId) {
        requirePositiveId(programVersionCompletionRequirementId, "Program version completion requirement id");

        return programVersionCompletionRequirementRepository.findCompletionRequirementById(programVersionCompletionRequirementId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Program version completion requirement was not found."
                ));
    }

    private void validateCompletionRequirementOptions(
            List<CreateProgramVersionCompletionRequirementOptionRequest> options
    ) {
        if (options == null || options.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Completion requirements need at least one option."
            );
        }

        Set<String> optionKeys = new HashSet<>();
        for (CreateProgramVersionCompletionRequirementOptionRequest option : options) {
            validateCompletionRequirementOptionTarget(
                    option.requiredProgramTypeId(),
                    option.requiredProgramId(),
                    option.requiredProgramVersionId(),
                    optionKeys
            );
        }
    }

    private void validatePatchCompletionRequirementOptions(
            List<PatchProgramVersionCompletionRequirementOptionRequest> options
    ) {
        if (options.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Completion requirements need at least one option."
            );
        }

        Set<String> optionKeys = new HashSet<>();
        for (PatchProgramVersionCompletionRequirementOptionRequest option : options) {
            validateCompletionRequirementOptionTarget(
                    option.requiredProgramTypeId(),
                    option.requiredProgramId(),
                    option.requiredProgramVersionId(),
                    optionKeys
            );
        }
    }

    private void validateCompletionRequirementOptionTarget(
            Long requiredProgramTypeId,
            Long requiredProgramId,
            Long requiredProgramVersionId,
            Set<String> optionKeys
    ) {
        int targetCount = (requiredProgramTypeId == null ? 0 : 1)
                + (requiredProgramId == null ? 0 : 1)
                + (requiredProgramVersionId == null ? 0 : 1);

        if (targetCount != 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Each completion requirement option must target exactly one program type, program, or program version."
            );
        }

        String optionKey = requiredProgramTypeId != null
                ? "type:" + requiredProgramTypeId
                : requiredProgramId != null
                ? "program:" + requiredProgramId
                : "version:" + requiredProgramVersionId;
        if (!optionKeys.add(optionKey)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Completion requirement options cannot include duplicates."
            );
        }
    }

    private ProgramVersionCompletionRequirementOption toCompletionRequirementOption(
            ProgramVersionCompletionRequirement completionRequirement,
            CreateProgramVersionCompletionRequirementOptionRequest request
    ) {
        ProgramVersionCompletionRequirementOption option = new ProgramVersionCompletionRequirementOption();
        option.setCompletionRequirement(completionRequirement);
        option.setRequiredProgramType(resolveProgramType(request.requiredProgramTypeId()));
        option.setRequiredProgram(resolveRequiredProgram(completionRequirement, request.requiredProgramId()));
        option.setRequiredProgramVersion(resolveRequiredProgramVersion(completionRequirement, request.requiredProgramVersionId()));
        return option;
    }

    private ProgramVersionCompletionRequirementOption toCompletionRequirementOption(
            ProgramVersionCompletionRequirement completionRequirement,
            PatchProgramVersionCompletionRequirementOptionRequest request
    ) {
        ProgramVersionCompletionRequirementOption option = new ProgramVersionCompletionRequirementOption();
        option.setCompletionRequirement(completionRequirement);
        option.setRequiredProgramType(resolveProgramType(request.requiredProgramTypeId()));
        option.setRequiredProgram(resolveRequiredProgram(completionRequirement, request.requiredProgramId()));
        option.setRequiredProgramVersion(resolveRequiredProgramVersion(completionRequirement, request.requiredProgramVersionId()));
        return option;
    }

    private ProgramType resolveProgramType(Long programTypeId) {
        if (programTypeId == null) {
            return null;
        }

        return programTypeRepository.findById(programTypeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program type id is invalid."));
    }

    private Program resolveRequiredProgram(
            ProgramVersionCompletionRequirement completionRequirement,
            Long programId
    ) {
        if (programId == null) {
            return null;
        }

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program id is invalid."));
        Program currentProgram = completionRequirement.getProgramVersion() == null
                ? null
                : completionRequirement.getProgramVersion().getProgram();
        if (currentProgram != null && Objects.equals(currentProgram.getId(), program.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A program cannot require itself."
            );
        }
        return program;
    }

    private ProgramVersion resolveRequiredProgramVersion(
            ProgramVersionCompletionRequirement completionRequirement,
            Long programVersionId
    ) {
        if (programVersionId == null) {
            return null;
        }

        ProgramVersion programVersion = programVersionRepository.findById(programVersionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program version id is invalid."));
        if (completionRequirement.getProgramVersion() != null
                && Objects.equals(completionRequirement.getProgramVersion().getId(), programVersion.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A program version cannot require itself."
            );
        }
        return programVersion;
    }

    private RequirementSearchResultResponse mapRequirementSearchResultResponse(Requirement requirement) {
        List<Long> requirementIds = List.of(requirement.getId());

        return requirementMapper.toRequirementSearchResultResponse(
                requirement,
                requirementCourseRepository.findCoursesForRequirements(requirementIds).size(),
                requirementCourseRuleRepository.findRulesForRequirements(requirementIds).size()
        );
    }

    private Requirement findRequirement(Long requirementId) {
        requirePositiveId(requirementId, "Requirement id");

        return requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement was not found."));
    }

    private boolean matchesRequirementType(Requirement requirement, String requirementType) {
        String normalizedRequirementType = trimToNull(requirementType);
        return normalizedRequirementType == null
                || Objects.equals(requirement.getRequirementType(), normalizedRequirementType);
    }

}
