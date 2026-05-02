package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.program.CreateProgramRequest;
import com.msm.sis.api.dto.program.CreateProgramVersionRequest;
import com.msm.sis.api.dto.program.ProgramDetailResponse;
import com.msm.sis.api.dto.program.ProgramSearchResponse;
import com.msm.sis.api.dto.program.ProgramSearchResultResponse;
import com.msm.sis.api.dto.program.ProgramVersionDetailResponse;
import com.msm.sis.api.dto.program.ProgramVersionRequirementResponse;
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
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class ProgramMapper {
    private final RequirementMapper requirementMapper;

    public ProgramMapper(RequirementMapper requirementMapper) {
        this.requirementMapper = requirementMapper;
    }

    public ProgramSearchResultResponse toProgramSearchResultResponse(
            Program program,
            ProgramVersion currentVersion
    ) {
        AcademicSchool school = program.getSchool();
        AcademicDepartment department = program.getDepartment();
        ProgramType programType = program.getProgramType();
        DegreeType degreeType = program.getDegreeType();

        return new ProgramSearchResultResponse(
                program.getId(),
                programType == null ? null : programType.getId(),
                programType == null ? null : programType.getCode(),
                programType == null ? null : programType.getName(),
                degreeType == null ? null : degreeType.getId(),
                degreeType == null ? null : degreeType.getCode(),
                degreeType == null ? null : degreeType.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                program.getCode(),
                program.getName(),
                program.getDescription(),
                currentVersion == null ? null : currentVersion.getVersionNumber(),
                currentVersion == null ? null : currentVersion.isPublished(),
                currentVersion == null ? null : currentVersion.getClassYearStart(),
                currentVersion == null ? null : currentVersion.getClassYearEnd(),
                program.getCreatedAt(),
                program.getUpdatedAt()
        );
    }

    public ProgramSearchResponse toProgramSearchResponse(
            List<ProgramSearchResultResponse> results,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
        return new ProgramSearchResponse(results, page, size, totalElements, totalPages);
    }

    public Program toProgram(
            AcademicSchool school,
            AcademicDepartment department,
            ProgramType programType,
            DegreeType degreeType,
            String programCode,
            CreateProgramRequest request
    ) {
        Program program = new Program();
        program.setSchool(school);
        program.setDepartment(department);
        program.setProgramType(programType);
        program.setDegreeType(degreeType);
        program.setCode(programCode);
        program.setName(request.name().trim());
        program.setDescription(trimToNull(request.description()));
        return program;
    }

    public ProgramVersion toInitialProgramVersion(
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
        return programVersion;
    }

    public ProgramDetailResponse toProgramDetailResponse(
            Program program,
            List<ProgramVersion> versions,
            Map<Long, List<ProgramVersionRequirement>> requirementsByVersionId,
            Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId,
            Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId
    ) {
        AcademicSchool school = program.getSchool();
        AcademicDepartment department = program.getDepartment();
        ProgramType programType = program.getProgramType();
        DegreeType degreeType = program.getDegreeType();

        List<ProgramVersionDetailResponse> versionResponses = versions.stream()
                .map(programVersion -> toProgramVersionDetailResponse(
                        programVersion,
                        requirementsByVersionId.getOrDefault(programVersion.getId(), List.of()),
                        requirementCoursesByRequirementId,
                        requirementCourseRulesByRequirementId
                ))
                .toList();

        return new ProgramDetailResponse(
                program.getId(),
                programType == null ? null : programType.getId(),
                programType == null ? null : programType.getCode(),
                programType == null ? null : programType.getName(),
                degreeType == null ? null : degreeType.getId(),
                degreeType == null ? null : degreeType.getCode(),
                degreeType == null ? null : degreeType.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                program.getCode(),
                program.getName(),
                program.getDescription(),
                versionResponses,
                program.getCreatedAt(),
                program.getUpdatedAt()
        );
    }

    private ProgramVersionDetailResponse toProgramVersionDetailResponse(
            ProgramVersion programVersion,
            List<ProgramVersionRequirement> programVersionRequirements,
            Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId,
            Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId
    ) {
        return new ProgramVersionDetailResponse(
                programVersion.getId(),
                programVersion.getVersionNumber(),
                programVersion.isPublished(),
                programVersion.getClassYearStart(),
                programVersion.getClassYearEnd(),
                programVersion.getNotes(),
                programVersionRequirements.stream()
                        .map(programVersionRequirement -> toProgramVersionRequirementResponse(
                                programVersionRequirement,
                                requirementCoursesByRequirementId,
                                requirementCourseRulesByRequirementId
                        ))
                        .toList(),
                programVersion.getCreatedAt(),
                programVersion.getUpdatedAt()
        );
    }

    public ProgramVersionRequirementResponse toProgramVersionRequirementResponse(
            ProgramVersionRequirement programVersionRequirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules
    ) {
        return requirementMapper.toProgramVersionRequirementResponse(
                programVersionRequirement,
                requirementCourses,
                requirementCourseRules
        );
    }

    private ProgramVersionRequirementResponse toProgramVersionRequirementResponse(
            ProgramVersionRequirement programVersionRequirement,
            Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId,
            Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId
    ) {
        Requirement requirement = programVersionRequirement.getRequirement();
        Long requirementId = requirement == null ? null : requirement.getId();

        return toProgramVersionRequirementResponse(
                programVersionRequirement,
                requirementId == null
                        ? List.of()
                        : requirementCoursesByRequirementId.getOrDefault(requirementId, List.of()),
                requirementId == null
                        ? List.of()
                        : requirementCourseRulesByRequirementId.getOrDefault(requirementId, List.of())
        );
    }
}
