package com.msm.sis.api.controller;

import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.StudentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@Tag(name = "Students", description = "Student endpoints")
public class StudentController {

    private final StudentRepository studentRepository;

    public StudentController(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get student by id", description = "Returns a single student record")
    public ResponseEntity<Student> getStudent(@PathVariable Long id) {
        return studentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create student", description = "Creates a new student record")
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        student.setId(null);
        student.setCreatedAt(null);
        Student savedStudent = studentRepository.save(student);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedStudent.getId())
                .toUri();

        return ResponseEntity.created(location).body(savedStudent);
    }

    @GetMapping
    public ResponseEntity<List<Student>> searchStudents(@RequestParam(required = false) String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<Student> students =
                studentRepository.findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(q.trim(), q.trim());

        return ResponseEntity.ok(students);
    }
}
