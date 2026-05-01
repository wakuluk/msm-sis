package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.CreateProgramRequest;
import com.msm.sis.api.dto.program.CreateProgramResponse;
import com.msm.sis.api.dto.program.CreateProgramVersionRequest;
import com.msm.sis.api.dto.program.ProgramDetailResponse;
import com.msm.sis.api.dto.program.ProgramSearchCriteria;
import com.msm.sis.api.dto.program.ProgramSearchResponse;
import com.msm.sis.api.dto.program.ProgramSearchResultResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.entity.DegreeType;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.mapper.ProgramMapper;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicSchoolRepository;
import com.msm.sis.api.repository.DegreeTypeRepository;
import com.msm.sis.api.repository.ProgramRepository;
import com.msm.sis.api.repository.ProgramTypeRepository;
import com.msm.sis.api.repository.ProgramVersionRepository;
import com.msm.sis.api.repository.ProgramVersionRequirementRepository;
import com.msm.sis.api.repository.RequirementCourseRepository;
import com.msm.sis.api.repository.RequirementCourseRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class ProgramService {
    private final AcademicSchoolRepository academicSchoolRepository;
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final DegreeTypeRepository degreeTypeRepository;
    private final ProgramRepository programRepository;
    private final ProgramTypeRepository programTypeRepository;
    private final ProgramVersionRepository programVersionRepository;
    private final ProgramVersionRequirementRepository programVersionRequirementRepository;
    private final RequirementCourseRepository requirementCourseRepository;
    private final RequirementCourseRuleRepository requirementCourseRuleRepository;
    private final ProgramMapper programMapper;
    private final ProgramValidationService programValidationService;

    @Transactional
    public CreateProgramResponse createProgram(CreateProgramRequest request) {
        programValidationService.validateCreateProgramRequest(request);
        String programCode = request.code().trim();
        programValidationService.validateProgramCodeAvailable(programCode);

        AcademicSchool school = resolveSchool(request.schoolId());
        AcademicDepartment department = resolveDepartment(request.departmentId(), school);
        ProgramType programType = programTypeRepository.findById(request.programTypeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program type id is invalid."));
        DegreeType degreeType = resolveDegreeType(request.degreeTypeId());
        programValidationService.validateProgramTypeRelationships(programType, school, department, degreeType);

        Program program = new Program();
        program.setSchool(school);
        program.setDepartment(department);
        program.setProgramType(programType);
        program.setDegreeType(degreeType);
        program.setCode(programCode);
        program.setName(request.name().trim());
        program.setDescription(trimToNull(request.description()));

        Program savedProgram = programRepository.save(program);
        ProgramVersion savedProgramVersion = createInitialProgramVersion(savedProgram, request.initialVersion());

        return new CreateProgramResponse(savedProgram.getId(), savedProgramVersion.getId());
    }

    private AcademicSchool resolveSchool(Long schoolId) {
        if (schoolId == null) {
            return null;
        }

        return academicSchoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "School id is invalid."));
    }

    @Transactional(readOnly = true)
    public ProgramDetailResponse getProgramDetail(Long programId) {
        if (programId == null || programId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program id must be a positive number.");
        }

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program was not found."));
        List<ProgramVersion> versions = programVersionRepository.findVersionsForProgram(programId);
        Map<Long, List<ProgramVersionRequirement>> requirementsByVersionId = buildRequirementsByVersionId(versions);
        List<Long> requirementIds = collectRequirementIds(requirementsByVersionId);
        Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId =
                buildRequirementCoursesByRequirementId(requirementIds);
        Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId =
                buildRequirementCourseRulesByRequirementId(requirementIds);

        return programMapper.toProgramDetailResponse(
                program,
                versions,
                requirementsByVersionId,
                requirementCoursesByRequirementId,
                requirementCourseRulesByRequirementId
        );
    }

    @Transactional(readOnly = true)
    public ProgramSearchResponse searchPrograms(
            ProgramSearchCriteria criteria,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }

        ProgramSearchCriteria effectiveCriteria = criteria == null ? new ProgramSearchCriteria() : criteria;
        List<Program> programs = programRepository.findAll();
        Map<Long, ProgramVersion> currentVersionsByProgramId = buildCurrentVersionsByProgramId(programs);

        List<ProgramSearchResultResponse> filteredResults = programs.stream()
                .filter(program -> matchesProgramSearchCriteria(program, effectiveCriteria))
                .sorted(buildProgramSearchComparator(
                        sortBy == null ? effectiveCriteria.getSortBy() : sortBy,
                        sortDirection == null ? effectiveCriteria.getSortDirection() : sortDirection
                ))
                .map(program -> programMapper.toProgramSearchResultResponse(
                        program,
                        currentVersionsByProgramId.get(program.getId())
                ))
                .toList();

        long totalElements = filteredResults.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, filteredResults.size());
        int toIndex = Math.min(fromIndex + size, filteredResults.size());

        return programMapper.toProgramSearchResponse(
                filteredResults.subList(fromIndex, toIndex),
                page,
                size,
                totalElements,
                totalPages
        );
    }

    private ProgramVersion createInitialProgramVersion(
            Program program,
            CreateProgramVersionRequest request
    ) {
        ProgramVersion programVersion = new ProgramVersion();
        programVersion.setProgram(program);
        programVersion.setVersionNumber(1);
        programVersion.setPublished(Boolean.TRUE.equals(request.published()));
        programVersion.setClassYearStart(request.classYearStart());
        programVersion.setClassYearEnd(request.classYearEnd());
        programVersion.setNotes(trimToNull(request.notes()));
        return programVersionRepository.save(programVersion);
    }

    private AcademicDepartment resolveDepartment(Long departmentId, AcademicSchool school) {
        if (departmentId == null) {
            return null;
        }

        AcademicDepartment department = academicDepartmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department id is invalid."));

        programValidationService.validateDepartmentBelongsToSchool(department, school);

        return department;
    }

    private DegreeType resolveDegreeType(Long degreeTypeId) {
        if (degreeTypeId == null) {
            return null;
        }

        return degreeTypeRepository.findById(degreeTypeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Degree type id is invalid."));
    }

    private Map<Long, List<ProgramVersionRequirement>> buildRequirementsByVersionId(
            List<ProgramVersion> versions
    ) {
        if (versions.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<ProgramVersionRequirement>> requirementsByVersionId = new LinkedHashMap<>();
        versions.forEach(programVersion -> requirementsByVersionId.put(
                programVersion.getId(),
                programVersionRequirementRepository.findRequirementsForVersion(programVersion.getId())
        ));

        return requirementsByVersionId;
    }

    private List<Long> collectRequirementIds(
            Map<Long, List<ProgramVersionRequirement>> requirementsByVersionId
    ) {
        return requirementsByVersionId.values().stream()
                .flatMap(List::stream)
                .map(ProgramVersionRequirement::getRequirement)
                .filter(Objects::nonNull)
                .map(Requirement::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private Map<Long, List<RequirementCourse>> buildRequirementCoursesByRequirementId(
            List<Long> requirementIds
    ) {
        if (requirementIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId = new LinkedHashMap<>();
        requirementCourseRepository.findCoursesForRequirements(requirementIds)
                .forEach(requirementCourse -> {
                    if (requirementCourse.getRequirement() == null
                            || requirementCourse.getRequirement().getId() == null) {
                        return;
                    }

                    requirementCoursesByRequirementId
                            .computeIfAbsent(requirementCourse.getRequirement().getId(), ignored -> new java.util.ArrayList<>())
                            .add(requirementCourse);
                });

        return requirementCoursesByRequirementId;
    }

    private Map<Long, List<RequirementCourseRule>> buildRequirementCourseRulesByRequirementId(
            List<Long> requirementIds
    ) {
        if (requirementIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId = new LinkedHashMap<>();
        requirementCourseRuleRepository.findRulesForRequirements(requirementIds)
                .forEach(requirementCourseRule -> {
                    if (requirementCourseRule.getRequirement() == null
                            || requirementCourseRule.getRequirement().getId() == null) {
                        return;
                    }

                    requirementCourseRulesByRequirementId
                            .computeIfAbsent(requirementCourseRule.getRequirement().getId(), ignored -> new java.util.ArrayList<>())
                            .add(requirementCourseRule);
                });

        return requirementCourseRulesByRequirementId;
    }

    private Map<Long, ProgramVersion> buildCurrentVersionsByProgramId(List<Program> programs) {
        List<Long> programIds = programs.stream()
                .map(Program::getId)
                .filter(Objects::nonNull)
                .toList();

        if (programIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, ProgramVersion> currentVersionsByProgramId = new LinkedHashMap<>();
        programVersionRepository.findOpenEndedVersionsForPrograms(programIds)
                .forEach(programVersion -> {
                    if (programVersion.getProgram() == null || programVersion.getProgram().getId() == null) {
                        return;
                    }

                    currentVersionsByProgramId.putIfAbsent(
                            programVersion.getProgram().getId(),
                            programVersion
                    );
                });

        return currentVersionsByProgramId;
    }

    private boolean matchesProgramSearchCriteria(Program program, ProgramSearchCriteria criteria) {
        if (program == null) {
            return false;
        }

        if (criteria.getProgramTypeId() != null) {
            Long programTypeId = program.getProgramType() == null ? null : program.getProgramType().getId();
            if (!Objects.equals(criteria.getProgramTypeId(), programTypeId)) {
                return false;
            }
        }

        if (criteria.getDegreeTypeId() != null) {
            Long degreeTypeId = program.getDegreeType() == null ? null : program.getDegreeType().getId();
            if (!Objects.equals(criteria.getDegreeTypeId(), degreeTypeId)) {
                return false;
            }
        }

        if (criteria.getSchoolId() != null) {
            Long schoolId = program.getSchool() == null ? null : program.getSchool().getId();
            if (!Objects.equals(criteria.getSchoolId(), schoolId)) {
                return false;
            }
        }

        if (criteria.getDepartmentId() != null) {
            Long departmentId = program.getDepartment() == null ? null : program.getDepartment().getId();
            if (!Objects.equals(criteria.getDepartmentId(), departmentId)) {
                return false;
            }
        }

        return containsIgnoreCase(program.getCode(), criteria.getCode())
                && containsIgnoreCase(program.getName(), criteria.getName());
    }

    private Comparator<Program> buildProgramSearchComparator(String sortBy, String sortDirection) {
        Sort.Direction direction = parseSortDirection(sortDirection);
        String normalizedSortBy = normalizeSortBy(sortBy, "code");

        Comparator<Program> primaryComparator = switch (normalizedSortBy) {
            case "programTypeName" -> compareStrings(direction, program -> {
                return program.getProgramType() == null ? null : program.getProgramType().getName();
            });
            case "degreeTypeName" -> compareStrings(direction, program -> {
                return program.getDegreeType() == null ? null : program.getDegreeType().getName();
            });
            case "schoolName" -> compareStrings(direction, program -> {
                return program.getSchool() == null ? null : program.getSchool().getName();
            });
            case "departmentName" -> compareStrings(direction, program -> {
                return program.getDepartment() == null ? null : program.getDepartment().getName();
            });
            case "code" -> compareStrings(direction, Program::getCode);
            case "name" -> compareStrings(direction, Program::getName);
            case "createdAt" -> Comparator.comparing(
                    Program::getCreatedAt,
                    direction == Sort.Direction.ASC
                            ? Comparator.nullsLast(Comparator.naturalOrder())
                            : Comparator.nullsLast(Comparator.reverseOrder())
            );
            case "updatedAt" -> Comparator.comparing(
                    Program::getUpdatedAt,
                    direction == Sort.Direction.ASC
                            ? Comparator.nullsLast(Comparator.naturalOrder())
                            : Comparator.nullsLast(Comparator.reverseOrder())
            );
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: programTypeName, degreeTypeName, schoolName, departmentName, code, name, createdAt, updatedAt."
            );
        };

        return primaryComparator
                .thenComparing(compareStrings(Sort.Direction.ASC, Program::getCode))
                .thenComparing(Comparator.comparing(Program::getId, Comparator.nullsLast(Long::compareTo)));
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        try {
            return Sort.Direction.fromString(sortDirection == null ? "asc" : sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

    private Comparator<Program> compareStrings(
            Sort.Direction direction,
            Function<Program, String> valueExtractor
    ) {
        Comparator<String> stringComparator = Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
        if (direction == Sort.Direction.DESC) {
            stringComparator = stringComparator.reversed();
        }

        return Comparator.comparing(valueExtractor, stringComparator);
    }

    private boolean containsIgnoreCase(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        if (value == null) {
            return false;
        }

        return value.toLowerCase(Locale.US).contains(filter.trim().toLowerCase(Locale.US));
    }

    private String normalizeSortBy(String sortBy, String defaultSortBy) {
        if (sortBy == null) {
            return defaultSortBy;
        }

        String trimmedSortBy = sortBy.trim();
        return trimmedSortBy.isEmpty() ? defaultSortBy : trimmedSortBy;
    }

}
