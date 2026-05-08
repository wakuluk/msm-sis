package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.program.assignment.StudentProgramAssignmentSearchCriteria;
import com.msm.sis.api.dto.student.program.assignment.StudentProgramAssignmentSearchPageResponse;
import com.msm.sis.api.dto.student.program.assignment.StudentProgramAssignmentSearchResponse;
import com.msm.sis.api.dto.student.program.assignment.StudentProgramAssignmentSearchResultResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.entity.ClassStanding;
import com.msm.sis.api.entity.DegreeType;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.entity.StudentProgramRequest;
import com.msm.sis.api.repository.AcademicDepartmentStaffRoleRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import com.msm.sis.api.repository.StudentProgramRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentProgramAssignmentSearchService {
    private static final String DEPARTMENT_HEAD_ROLE_CODE = "DEPARTMENT_HEAD";
    private static final int MAX_PAGE_SIZE = 100;

    private final AcademicDepartmentStaffRoleRepository academicDepartmentStaffRoleRepository;
    private final StudentProgramRepository studentProgramRepository;
    private final StudentProgramRequestRepository studentProgramRequestRepository;

    @Transactional(readOnly = true)
    public StudentProgramAssignmentSearchResponse searchAssignments(
            StudentProgramAssignmentSearchCriteria criteria,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        validatePageRequest(page, size, MAX_PAGE_SIZE);

        StudentProgramAssignmentSearchCriteria effectiveCriteria =
                criteria == null ? new StudentProgramAssignmentSearchCriteria() : criteria;
        Page<StudentProgram> resultPage = studentProgramRepository.findAssignments(
                normalizeStatus(effectiveCriteria.getStatus()),
                effectiveCriteria.getClassStandingId(),
                effectiveCriteria.getDegreeTypeId(),
                effectiveCriteria.getDepartmentId(),
                effectiveCriteria.getProgramTypeId(),
                effectiveCriteria.getSchoolId(),
                normalizeQuery(effectiveCriteria.getStudentQuery()),
                normalizeQuery(effectiveCriteria.getProgramQuery()),
                PageRequest.of(page, size, buildSort(sortBy, sortDirection))
        );

        return buildSearchResponse(resultPage);
    }

    @Transactional(readOnly = true)
    public StudentProgramAssignmentSearchResponse searchDepartmentHeadMajorAssignments(
            Long userId,
            StudentProgramAssignmentSearchCriteria criteria,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        requirePositiveId(userId, "User id");
        validatePageRequest(page, size, MAX_PAGE_SIZE);

        List<Long> departmentIds = academicDepartmentStaffRoleRepository.findActiveDepartmentIdsForUserAndRole(
                userId,
                DEPARTMENT_HEAD_ROLE_CODE,
                LocalDate.now()
        );

        if (departmentIds.isEmpty()) {
            return new StudentProgramAssignmentSearchResponse(
                    new StudentProgramAssignmentSearchPageResponse(page, size, 0, 0),
                    List.of()
            );
        }

        StudentProgramAssignmentSearchCriteria effectiveCriteria =
                criteria == null ? new StudentProgramAssignmentSearchCriteria() : criteria;
        Page<StudentProgram> resultPage = studentProgramRepository.findMajorAssignmentsForDepartments(
                departmentIds,
                normalizeStatus(effectiveCriteria.getStatus()),
                effectiveCriteria.getClassStandingId(),
                effectiveCriteria.getDegreeTypeId(),
                normalizeQuery(effectiveCriteria.getStudentQuery()),
                normalizeQuery(effectiveCriteria.getProgramQuery()),
                PageRequest.of(page, size, buildSort(sortBy, sortDirection))
        );

        return buildSearchResponse(resultPage);
    }

    private StudentProgramAssignmentSearchResponse buildSearchResponse(Page<StudentProgram> resultPage) {
        Map<Long, Long> requestIdsByStudentProgramId = findRequestIdsByStudentProgramId(
                resultPage.stream()
                        .map(StudentProgram::getId)
                        .toList()
        );
        return new StudentProgramAssignmentSearchResponse(
                new StudentProgramAssignmentSearchPageResponse(
                        resultPage.getNumber(),
                        resultPage.getSize(),
                        resultPage.getTotalElements(),
                        resultPage.getTotalPages()
                ),
                resultPage.stream()
                        .map(studentProgram -> toResultResponse(
                                studentProgram,
                                requestIdsByStudentProgramId.get(studentProgram.getId())
                        ))
                        .toList()
        );
    }

    private Map<Long, Long> findRequestIdsByStudentProgramId(List<Long> studentProgramIds) {
        if (studentProgramIds.isEmpty()) {
            return Map.of();
        }

        return studentProgramRequestRepository.findRequestsForStudentPrograms(studentProgramIds).stream()
                .filter(request -> request.getStudentProgram() != null)
                .filter(request -> request.getStudentProgram().getId() != null)
                .collect(Collectors.toMap(
                        request -> request.getStudentProgram().getId(),
                        StudentProgramRequest::getId,
                        (firstRequestId, ignoredLaterRequestId) -> firstRequestId,
                        LinkedHashMap::new
                ));
    }

    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);

        return switch (sortBy == null ? "student" : sortBy) {
            case "program" -> Sort.by(direction, "programVersion.program.name")
                    .and(Sort.by(direction, "programVersion.program.code"))
                    .and(Sort.by("id").ascending());
            case "department" -> Sort.by(direction, "programVersion.program.department.name")
                    .and(Sort.by(direction, "programVersion.program.name"))
                    .and(Sort.by("id").ascending());
            case "classStanding" -> Sort.by(direction, "student.classStanding.name")
                    .and(Sort.by(direction, "student.lastName"))
                    .and(Sort.by("id").ascending());
            case "status" -> Sort.by(direction, "status")
                    .and(Sort.by(direction, "student.lastName"))
                    .and(Sort.by("id").ascending());
            case "declaredDate" -> Sort.by(direction, "declaredDate")
                    .and(Sort.by(direction, "student.lastName"))
                    .and(Sort.by("id").ascending());
            default -> Sort.by(direction, "student.lastName")
                    .and(Sort.by(direction, "student.firstName"))
                    .and(Sort.by(direction, "student.email"))
                    .and(Sort.by("id").ascending());
        };
    }

    private String normalizeQuery(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return "%" + value.trim().toLowerCase() + "%";
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }

        return status.trim().toUpperCase();
    }

    private StudentProgramAssignmentSearchResultResponse toResultResponse(
            StudentProgram studentProgram,
            Long studentProgramRequestId
    ) {
        Student student = studentProgram.getStudent();
        ProgramVersion programVersion = studentProgram.getProgramVersion();
        Program program = programVersion == null ? null : programVersion.getProgram();
        ProgramType programType = program == null ? null : program.getProgramType();
        DegreeType degreeType = program == null ? null : program.getDegreeType();
        AcademicSchool school = program == null ? null : program.getSchool();
        AcademicDepartment department = program == null ? null : program.getDepartment();
        ClassStanding classStanding = student == null ? null : student.getClassStanding();

        return new StudentProgramAssignmentSearchResultResponse(
                studentProgram.getId(),
                studentProgramRequestId,
                studentProgram.getStatus(),
                studentProgram.getDeclaredDate(),
                studentProgram.getCompletedDate(),
                student == null ? null : student.getId(),
                student == null ? null : student.getFirstName(),
                student == null ? null : student.getLastName(),
                student == null ? null : student.getPreferredName(),
                student == null ? null : student.getEmail(),
                classStanding == null ? null : classStanding.getName(),
                student == null ? null : student.getEstimatedGradDate(),
                program == null ? null : program.getId(),
                programVersion == null ? null : programVersion.getId(),
                programVersion == null ? null : programVersion.getVersionNumber(),
                programVersion == null ? null : programVersion.getClassYearStart(),
                programVersion == null ? null : programVersion.getClassYearEnd(),
                program == null ? null : program.getCode(),
                program == null ? null : program.getName(),
                programType == null ? null : programType.getCode(),
                programType == null ? null : programType.getName(),
                degreeType == null ? null : degreeType.getCode(),
                degreeType == null ? null : degreeType.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName()
        );
    }
}
