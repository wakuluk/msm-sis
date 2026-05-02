package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.UpsertRequirementCourseRequest;
import com.msm.sis.api.dto.program.UpsertRequirementCourseRuleRequest;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.mapper.RequirementMapper;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.RequirementCourseRepository;
import com.msm.sis.api.repository.RequirementCourseRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RequirementComponentService {
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final CourseRepository courseRepository;
    private final RequirementCourseRepository requirementCourseRepository;
    private final RequirementCourseRuleRepository requirementCourseRuleRepository;
    private final RequirementMapper requirementMapper;
    private final RequirementValidationService requirementValidationService;

    public void replaceRequirementCourses(
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

    public void replaceRequirementCourseRules(
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

    private RequirementCourse toRequirementCourse(
            Requirement requirement,
            UpsertRequirementCourseRequest request
    ) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course id is invalid."));

        return requirementMapper.toRequirementCourse(requirement, course, request);
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

        return requirementMapper.toRequirementCourseRule(requirement, department, request);
    }
}
