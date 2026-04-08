package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.CreateStudentRequest;
import com.msm.sis.api.dto.StudentProfileResponse;
import com.msm.sis.api.entity.Student;
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
import java.util.List;

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
    public ResponseEntity<Student> getStudent(@NotNull @PathVariable Long studentId) {
        return ResponseEntity.ok(studentService.getStudentById(studentId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create student", description = "Creates a new student record")
    public ResponseEntity<Student> createStudent(@NotNull @RequestBody CreateStudentRequest request) {
        Student savedStudent = studentService.createStudent(request);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{studentId}")
                .buildAndExpand(savedStudent.getId())
                .toUri();

        return ResponseEntity.created(location).body(savedStudent);
    }

    @PostMapping("/search/")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search student by last name", description = "Search student by last name")
    public ResponseEntity<List<Student>> searchStudents(@RequestParam(required = false) String lastName) {
        return ResponseEntity.ok(studentService.searchStudents(lastName));
    }
}
