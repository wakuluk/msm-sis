package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.AttachProgramVersionRequirementRequest;
import com.msm.sis.api.dto.program.CreateRequirementRequest;
import com.msm.sis.api.dto.program.PatchProgramVersionRequirementRequest;
import com.msm.sis.api.dto.program.PatchRequirementRequest;
import com.msm.sis.api.dto.program.ProgramVersionRequirementResponse;
import com.msm.sis.api.dto.program.RequirementCourseResponse;
import com.msm.sis.api.dto.program.RequirementCourseRuleResponse;
import com.msm.sis.api.dto.program.RequirementDetailResponse;
import com.msm.sis.api.dto.program.RequirementSearchCriteria;
import com.msm.sis.api.dto.program.RequirementSearchResponse;
import com.msm.sis.api.dto.program.RequirementSearchResultResponse;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRequest;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRuleRequest;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.mapper.ProgramMapper;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.ProgramVersionRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class RequirementService {
    private static final String TOTAL_ELECTIVE_CREDITS = "TOTAL_ELECTIVE_CREDITS";
    private static final String SPECIFIC_COURSES = "SPECIFIC_COURSES";
    private static final String DEPARTMENT_LEVEL_COURSES = "DEPARTMENT_LEVEL_COURSES";
    private static final String MANUAL = "MANUAL";

    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final CourseRepository courseRepository;
    private final ProgramMapper programMapper;
    private final ProgramVersionRepository programVersionRepository;
    private final ProgramVersionRequirementRepository programVersionRequirementRepository;
    private final RequirementRepository requirementRepository;
    private final RequirementCourseRepository requirementCourseRepository;
    private final RequirementCourseRuleRepository requirementCourseRuleRepository;
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
                .map(this::toRequirementSearchResultResponse)
                .toList();

        return new RequirementSearchResponse(results, page, size, totalElements, totalPages);
    }

    @Transactional(readOnly = true)
    public RequirementDetailResponse getRequirementDetail(Long requirementId) {
        Requirement requirement = findRequirement(requirementId);
        List<Long> requirementIds = List.of(requirement.getId());

        return new RequirementDetailResponse(
                requirement.getId(),
                requirement.getCode(),
                requirement.getName(),
                requirement.getRequirementType(),
                requirement.getDescription(),
                requirement.getMinimumCredits(),
                requirement.getMinimumCourses(),
                requirement.getCourseMatchMode(),
                requirement.getMinimumGrade(),
                requirementCourseRepository.findCoursesForRequirements(requirementIds).stream()
                        .map(this::toRequirementCourseResponse)
                        .toList(),
                requirementCourseRuleRepository.findRulesForRequirements(requirementIds).stream()
                        .map(this::toRequirementCourseRuleResponse)
                        .toList(),
                requirement.getCreatedAt(),
                requirement.getUpdatedAt()
        );
    }

    @Transactional
    public RequirementSearchResultResponse createRequirement(CreateRequirementRequest request) {
        requirementValidationService.validateCreateRequirementRequest(request);
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
        replaceRequirementCourses(savedRequirement, request.requirementCourses());
        replaceRequirementCourseRules(savedRequirement, request.requirementCourseRules());

        return toRequirementSearchResultResponse(savedRequirement);
    }

    @Transactional
    public RequirementSearchResultResponse patchRequirement(Long requirementId, PatchRequirementRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        Requirement requirement = findRequirement(requirementId);
        applyRequirementPatch(requirement, request);
        normalizeRequirementFieldsForType(requirement);
        requirementValidationService.validateRequirementShape(
                requirement.getRequirementType(),
                requirement.getMinimumCredits(),
                requirement.getMinimumCourses(),
                requirement.getCourseMatchMode(),
                request.requirementCourses(),
                request.requirementCourseRules(),
                false
        );

        Requirement savedRequirement = requirementRepository.save(requirement);

        if (request.requirementCourses() != null) {
            replaceRequirementCourses(savedRequirement, request.requirementCourses());
        }

        if (request.requirementCourseRules() != null) {
            replaceRequirementCourseRules(savedRequirement, request.requirementCourseRules());
        }

        return toRequirementSearchResultResponse(savedRequirement);
    }

    @Transactional
    public ProgramVersionRequirementResponse attachRequirementToProgramVersion(
            Long programVersionId,
            AttachProgramVersionRequirementRequest request
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        ProgramVersion programVersion = programVersionRepository.findById(programVersionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program version was not found."));
        Requirement requirement = findRequirement(request.requirementId());

        requirementValidationService.validateRequirementAssignmentAvailable(programVersionId, requirement.getId());

        ProgramVersionRequirement assignment = new ProgramVersionRequirement();
        assignment.setProgramVersion(programVersion);
        assignment.setRequirement(requirement);
        assignment.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        assignment.setRequired(true);
        assignment.setNotes(trimToNull(request.notes()));

        return toProgramVersionRequirementResponse(programVersionRequirementRepository.save(assignment));
    }

    @Transactional
    public ProgramVersionRequirementResponse patchProgramVersionRequirement(
            Long programVersionRequirementId,
            PatchProgramVersionRequirementRequest request
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

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

        return toProgramVersionRequirementResponse(programVersionRequirementRepository.save(assignment));
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

    private void replaceRequirementCourses(
            Requirement requirement,
            List<UpsertRequirementCourseRequest> requests
    ) {
        List<RequirementCourse> existingCourses =
                requirementCourseRepository.findCoursesForRequirements(List.of(requirement.getId()));
        requirementCourseRepository.deleteAll(existingCourses);
        requirementCourseRepository.flush();

        if (requests == null || requests.isEmpty()) {
            return;
        }

        List<RequirementCourse> requirementCourses = requests.stream()
                .map(request -> toRequirementCourse(requirement, request))
                .toList();
        requirementCourseRepository.saveAll(requirementCourses);
    }

    private RequirementCourse toRequirementCourse(
            Requirement requirement,
            UpsertRequirementCourseRequest request
    ) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course id is invalid."));

        RequirementCourse requirementCourse = new RequirementCourse();
        requirementCourse.setRequirement(requirement);
        requirementCourse.setCourse(course);
        requirementCourse.setRequired(true);
        requirementCourse.setMinimumGrade(trimToNull(request.minimumGrade()));
        return requirementCourse;
    }

    private void replaceRequirementCourseRules(
            Requirement requirement,
            List<UpsertRequirementCourseRuleRequest> requests
    ) {
        List<RequirementCourseRule> existingRules =
                requirementCourseRuleRepository.findRulesForRequirements(List.of(requirement.getId()));
        requirementCourseRuleRepository.deleteAll(existingRules);
        requirementCourseRuleRepository.flush();

        if (requests == null || requests.isEmpty()) {
            return;
        }

        List<RequirementCourseRule> requirementCourseRules = requests.stream()
                .map(request -> toRequirementCourseRule(requirement, request))
                .toList();
        requirementCourseRuleRepository.saveAll(requirementCourseRules);
    }

    private RequirementCourseRule toRequirementCourseRule(
            Requirement requirement,
            UpsertRequirementCourseRuleRequest request
    ) {
        requirementValidationService.validateRequirementCourseRuleRange(
                request.minimumCourseNumber(),
                request.maximumCourseNumber()
        );

        AcademicDepartment department = academicDepartmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department id is invalid."));

        RequirementCourseRule requirementCourseRule = new RequirementCourseRule();
        requirementCourseRule.setRequirement(requirement);
        requirementCourseRule.setDepartment(department);
        requirementCourseRule.setMinimumCourseNumber(request.minimumCourseNumber());
        requirementCourseRule.setMaximumCourseNumber(request.maximumCourseNumber());
        requirementCourseRule.setMinimumCredits(request.minimumCredits());
        requirementCourseRule.setMinimumCourses(request.minimumCourses());
        requirementCourseRule.setMinimumGrade(trimToNull(request.minimumGrade()));
        return requirementCourseRule;
    }

    private ProgramVersionRequirementResponse toProgramVersionRequirementResponse(
            ProgramVersionRequirement assignment
    ) {
        Long requirementId = assignment.getRequirement() == null ? null : assignment.getRequirement().getId();

        if (requirementId == null) {
            return programMapper.toProgramVersionRequirementResponse(assignment, List.of(), List.of());
        }

        return programMapper.toProgramVersionRequirementResponse(
                assignment,
                requirementCourseRepository.findCoursesForRequirements(List.of(requirementId)),
                requirementCourseRuleRepository.findRulesForRequirements(List.of(requirementId))
        );
    }

    private RequirementSearchResultResponse toRequirementSearchResultResponse(Requirement requirement) {
        List<Long> requirementIds = List.of(requirement.getId());

        return new RequirementSearchResultResponse(
                requirement.getId(),
                requirement.getCode(),
                requirement.getName(),
                requirement.getRequirementType(),
                requirement.getDescription(),
                requirement.getMinimumCredits(),
                requirement.getMinimumCourses(),
                requirement.getCourseMatchMode(),
                requirement.getMinimumGrade(),
                requirementCourseRepository.findCoursesForRequirements(requirementIds).size(),
                requirementCourseRuleRepository.findRulesForRequirements(requirementIds).size()
        );
    }

    private RequirementCourseResponse toRequirementCourseResponse(RequirementCourse requirementCourse) {
        Course course = requirementCourse.getCourse();
        AcademicSubject subject = course == null ? null : course.getSubject();

        return new RequirementCourseResponse(
                requirementCourse.getId(),
                course == null ? null : course.getId(),
                subject == null ? null : subject.getCode(),
                course == null ? null : course.getCourseNumber(),
                requirementCourse.isRequired(),
                requirementCourse.getMinimumGrade()
        );
    }

    private RequirementCourseRuleResponse toRequirementCourseRuleResponse(
            RequirementCourseRule requirementCourseRule
    ) {
        AcademicDepartment department = requirementCourseRule.getDepartment();

        return new RequirementCourseRuleResponse(
                requirementCourseRule.getId(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                requirementCourseRule.getMinimumCourseNumber(),
                requirementCourseRule.getMaximumCourseNumber(),
                requirementCourseRule.getMinimumCredits(),
                requirementCourseRule.getMinimumCourses(),
                requirementCourseRule.getMinimumGrade()
        );
    }

    private Requirement findRequirement(Long requirementId) {
        if (requirementId == null || requirementId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement id must be a positive number.");
        }

        return requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement was not found."));
    }

    private boolean matchesRequirementType(Requirement requirement, String requirementType) {
        String normalizedRequirementType = trimToNull(requirementType);
        return normalizedRequirementType == null
                || Objects.equals(requirement.getRequirementType(), normalizedRequirementType);
    }

    private boolean containsIgnoreCase(String value, String filter) {
        String normalizedFilter = trimToNull(filter);

        if (normalizedFilter == null) {
            return true;
        }

        if (value == null) {
            return false;
        }

        return value.toLowerCase(Locale.US).contains(normalizedFilter.toLowerCase(Locale.US));
    }

}
