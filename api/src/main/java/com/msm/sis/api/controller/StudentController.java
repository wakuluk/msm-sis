package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.service.StudentAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@Tag(name = "Students", description = "Student endpoints")
public class StudentController {

    private final StudentAccessService studentAccessService;
    private final StudentRepository studentRepository;

    public StudentController(StudentRepository studentRepository, StudentAccessService studentAccessService) {
        this.studentRepository = studentRepository;
        this.studentAccessService = studentAccessService;
    }

    /***
     * This is the student section. Only the Student can access these endpoints.
     *
     */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get current student profile", description = "Returns the student record linked to the authenticated student user")
    public ResponseEntity<Student> getStudentProfile(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(studentAccessService.getStudentProfile(authenticatedUser));
    }

    /***
     * Admin can access these below.
     *
     */
    @GetMapping("/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get student by id", description = "Returns a single student record")
    public ResponseEntity<Student> getStudent(@PathVariable Long studentId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(studentAccessService.getAuthorizedStudentById(authenticatedUser, studentId));
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create student", description = "Creates a new student record")
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        student.setId(null);
        student.setCreatedAt(null);
        Student savedStudent = studentRepository.save(student);

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
        if (lastName == null || lastName.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<Student> students =
                studentRepository.findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(lastName.trim(), lastName.trim());

        return ResponseEntity.ok(students);
    }
}
