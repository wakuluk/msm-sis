package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.CreateStudentRequest;
import com.msm.sis.api.dto.PatchStudentRequest;
import com.msm.sis.api.dto.StudentDetailResponse;
import com.msm.sis.api.dto.StudentProfileResponse;
import com.msm.sis.api.dto.StudentSearchCriteria;
import com.msm.sis.api.dto.StudentSearchResponse;
import com.msm.sis.api.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/students")
@Tag(name = "Students", description = "Student endpoints")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    /***
     * This is the student section. Only the Student can access these endpoints.
     *
     */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get current student profile", description = "Returns the student record linked to the authenticated student user")
    public ResponseEntity<StudentProfileResponse> getStudentProfile(@AuthenticationPrincipal AuthenticatedJwt jwt) {
        return ResponseEntity.ok(studentService.getStudentProfile(jwt.getUserId()));
    }

    /***
     * Admin can access these below.
     *
     */
    @GetMapping("/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get student by id", description = "Returns a single student record")
    public ResponseEntity<StudentDetailResponse> getStudent(@NotNull @PathVariable Long studentId) {
        return ResponseEntity.ok(studentService.getStudentById(studentId));
    }

    @PatchMapping("/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch student by id", description = "Updates only the provided student fields")
    public ResponseEntity<StudentDetailResponse> patchStudent(
            @NotNull @PathVariable Long studentId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestBody PatchStudentRequest request
    ) {
        return ResponseEntity.ok(studentService.patchStudent(studentId, request, String.valueOf(jwt.getUserId())));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create student", description = "Creates a new student record")
    public ResponseEntity<StudentDetailResponse> createStudent(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @NotNull @RequestBody CreateStudentRequest request
    ) {
        StudentDetailResponse createdStudent = studentService.createStudent(request, String.valueOf(jwt.getUserId()));

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{studentId}")
                .buildAndExpand(createdStudent.studentId())
                .toUri();

        return ResponseEntity.created(location).body(createdStudent);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search students", description = "Returns paged student results for the provided optional filters")
    public ResponseEntity<StudentSearchResponse> searchStudents(
            @ModelAttribute StudentSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "lastName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(studentService.searchStudents(criteria, page, size, sortBy, sortDirection));
    }
}
