package com.msm.sis.api.controller;

import com.msm.sis.api.dto.academic.CreateAcademicSubjectRequest;
import com.msm.sis.api.dto.academic.PatchAcademicDepartmentRequest;
import com.msm.sis.api.dto.academic.AcademicDepartmentResponse;
import com.msm.sis.api.dto.course.CourseResponse;
import com.msm.sis.api.service.academic.AcademicDepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/academic-departments")
@Tag(name = "academic-departments", description = "Manage Academic Departments")
public class AcademicDepartmentsController {

    private final AcademicDepartmentService academicDepartmentService;

    public AcademicDepartmentsController(AcademicDepartmentService academicDepartmentService) {
        this.academicDepartmentService = academicDepartmentService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search academic departments", description = "Returns all academic departments ordered by name")
    public ResponseEntity<List<AcademicDepartmentResponse>> searchAcademicDepartments(
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(
                academicDepartmentService.searchAcademicDepartments(sortBy, sortDirection)
        );
    }

    @GetMapping("/{departmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get academic department", description = "Returns a single academic department by ID")
    public ResponseEntity<AcademicDepartmentResponse> getAcademicDepartment(
            @PathVariable Long departmentId,
            @RequestParam(defaultValue = "code") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(
                academicDepartmentService.getAcademicDepartment(departmentId, sortBy, sortDirection)
        );
    }

    @PostMapping("/{departmentId}/subjects")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create academic subject", description = "Creates a new academic subject within an academic department")
    public ResponseEntity<AcademicDepartmentResponse> postAcademicDepartmentSubject(
            @PathVariable Long departmentId,
            @Valid @NotNull @RequestBody CreateAcademicSubjectRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                academicDepartmentService.createAcademicSubject(departmentId, request)
        );
    }

    @GetMapping("/{departmentId}/{subjectId}/courses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create academic subject", description = "Creates a new academic subject within an academic department")
    public ResponseEntity<List<CourseResponse>> getAcademicDepartmentSubjectCourses(
            @PathVariable Long departmentId,
            @PathVariable Long subjectId
    ) {
        return ResponseEntity.ok(academicDepartmentService.getDepartmentSubjectCourses(departmentId, subjectId));
    }

    @PatchMapping("/{departmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch academic department", description = "Patches a single academic department by ID")
    public ResponseEntity<AcademicDepartmentResponse> patchAcademicDepartment(
            @PathVariable Long departmentId,
            @Valid @NotNull @RequestBody PatchAcademicDepartmentRequest request
    ) {
        return ResponseEntity.ok(
                academicDepartmentService.patchAcademicDepartment(departmentId, request)
        );
    }
}
