package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.student.academiccareer.CreateStudentAcademicCareerRequest;
import com.msm.sis.api.dto.student.academiccareer.StudentAcademicCareerResponse;
import com.msm.sis.api.dto.student.academiccareer.UpdateStudentAcademicCareerRequest;
import com.msm.sis.api.service.student.StudentAcademicCareerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/students/{studentId}/academic-careers")
@Tag(name = "student-academic-careers", description = "Manage student academic career history")
public class StudentAcademicCareerController {

    private final StudentAcademicCareerService studentAcademicCareerService;

    public StudentAcademicCareerController(StudentAcademicCareerService studentAcademicCareerService) {
        this.studentAcademicCareerService = studentAcademicCareerService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List student academic careers", description = "Returns academic career history for a student")
    public ResponseEntity<List<StudentAcademicCareerResponse>> getStudentAcademicCareers(
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(studentAcademicCareerService.listStudentAcademicCareers(studentId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create student academic career", description = "Adds an academic career row for a student")
    public ResponseEntity<StudentAcademicCareerResponse> createStudentAcademicCareer(
            @PathVariable Long studentId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody CreateStudentAcademicCareerRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                studentAcademicCareerService.createStudentAcademicCareer(
                        studentId,
                        request,
                        jwt == null ? null : jwt.getUserId()
                )
        );
    }

    @PatchMapping("/{studentAcademicCareerId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Patch student academic career", description = "Updates an academic career row for a student")
    public ResponseEntity<StudentAcademicCareerResponse> updateStudentAcademicCareer(
            @PathVariable Long studentId,
            @PathVariable Long studentAcademicCareerId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody UpdateStudentAcademicCareerRequest request
    ) {
        return ResponseEntity.ok(
                studentAcademicCareerService.updateStudentAcademicCareer(
                        studentId,
                        studentAcademicCareerId,
                        request,
                        jwt == null ? null : jwt.getUserId()
                )
        );
    }
}
