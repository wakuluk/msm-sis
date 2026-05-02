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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.ProgramGroupingUtils.collectProgramIds;
import static com.msm.sis.api.util.ProgramGroupingUtils.indexFirstVersionByProgramId;
import static com.msm.sis.api.util.RequirementGroupingUtils.collectRequirementIds;
import static com.msm.sis.api.util.RequirementGroupingUtils.groupRequirementCourseRulesByRequirementId;
import static com.msm.sis.api.util.RequirementGroupingUtils.groupRequirementCoursesByRequirementId;
import static com.msm.sis.api.util.TextUtils.containsIgnoreCase;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

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

        Program program = programMapper.toProgram(school, department, programType, degreeType, programCode, request);
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
        requirePositiveId(programId, "Program id");

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program was not found."));
        List<ProgramVersion> versions = programVersionRepository.findVersionsForProgram(programId);
        Map<Long, List<ProgramVersionRequirement>> requirementsByVersionId = buildRequirementsByVersionId(versions);
        List<Long> requirementIds = collectRequirementIds(requirementsByVersionId);
        Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId =
                groupRequirementCoursesByRequirementId(findRequirementCourses(requirementIds));
        Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId =
                groupRequirementCourseRulesByRequirementId(findRequirementCourseRules(requirementIds));

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
        validatePageRequest(page, size, 100);

        ProgramSearchCriteria effectiveCriteria = criteria == null ? new ProgramSearchCriteria() : criteria;
        List<Program> programs = programRepository.findAll();
        Map<Long, ProgramVersion> currentVersionsByProgramId = buildCurrentVersionsByProgramId(programs);

        List<ProgramSearchResultResponse> filteredResults = programs.stream()
                .filter(program -> matchesProgramSearchCriteria(program, effectiveCriteria))
                .sorted(ProgramSearchSort.buildComparator(
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
        return programVersionRepository.save(programMapper.toInitialProgramVersion(program, request));
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

    private Map<Long, ProgramVersion> buildCurrentVersionsByProgramId(List<Program> programs) {
        List<Long> programIds = collectProgramIds(programs);

        if (programIds.isEmpty()) {
            return Map.of();
        }

        return indexFirstVersionByProgramId(programVersionRepository.findOpenEndedVersionsForPrograms(programIds));
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

}
