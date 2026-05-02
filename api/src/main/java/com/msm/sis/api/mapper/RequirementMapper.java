package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.program.ProgramVersionRequirementResponse;
import com.msm.sis.api.dto.program.RequirementCourseResponse;
import com.msm.sis.api.dto.program.RequirementCourseRuleResponse;
import com.msm.sis.api.dto.program.RequirementDetailResponse;
import com.msm.sis.api.dto.program.RequirementSearchResultResponse;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRequest;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRuleRequest;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class RequirementMapper {

    public RequirementDetailResponse toRequirementDetailResponse(
            Requirement requirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules
    ) {
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
                requirementCourses.stream()
                        .map(this::toRequirementCourseResponse)
                        .toList(),
                requirementCourseRules.stream()
                        .map(this::toRequirementCourseRuleResponse)
                        .toList(),
                requirement.getCreatedAt(),
                requirement.getUpdatedAt()
        );
    }

    public RequirementSearchResultResponse toRequirementSearchResultResponse(
            Requirement requirement,
            int requirementCourseCount,
            int requirementCourseRuleCount
    ) {
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
                requirementCourseCount,
                requirementCourseRuleCount
        );
    }

    public ProgramVersionRequirementResponse toProgramVersionRequirementResponse(
            ProgramVersionRequirement programVersionRequirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules
    ) {
        Requirement requirement = programVersionRequirement.getRequirement();

        return new ProgramVersionRequirementResponse(
                programVersionRequirement.getId(),
                requirement == null ? null : requirement.getId(),
                requirement == null ? null : requirement.getCode(),
                requirement == null ? null : requirement.getName(),
                requirement == null ? null : requirement.getRequirementType(),
                requirement == null ? null : requirement.getDescription(),
                requirement == null ? null : requirement.getMinimumCredits(),
                requirement == null ? null : requirement.getMinimumCourses(),
                requirement == null ? null : requirement.getCourseMatchMode(),
                requirement == null ? null : requirement.getMinimumGrade(),
                requirementCourses.stream()
                        .map(this::toRequirementCourseResponse)
                        .toList(),
                requirementCourseRules.stream()
                        .map(this::toRequirementCourseRuleResponse)
                        .toList(),
                programVersionRequirement.getSortOrder(),
                programVersionRequirement.isRequired(),
                programVersionRequirement.getNotes()
        );
    }

    public RequirementCourseResponse toRequirementCourseResponse(RequirementCourse requirementCourse) {
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

    public RequirementCourseRuleResponse toRequirementCourseRuleResponse(
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

    public RequirementCourse toRequirementCourse(
            Requirement requirement,
            Course course,
            UpsertRequirementCourseRequest request
    ) {
        RequirementCourse requirementCourse = new RequirementCourse();
        requirementCourse.setRequirement(requirement);
        requirementCourse.setCourse(course);
        requirementCourse.setRequired(true);
        requirementCourse.setMinimumGrade(trimToNull(request.minimumGrade()));
        return requirementCourse;
    }

    public RequirementCourseRule toRequirementCourseRule(
            Requirement requirement,
            AcademicDepartment department,
            UpsertRequirementCourseRuleRequest request
    ) {
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
}
