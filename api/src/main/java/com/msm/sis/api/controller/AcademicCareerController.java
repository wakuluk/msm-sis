package com.msm.sis.api.controller;

import com.msm.sis.api.dto.student.academiccareer.AcademicCareerOptionResponse;
import com.msm.sis.api.service.student.StudentAcademicCareerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/academic-careers")
@Tag(name = "academic-careers", description = "Academic career reference data")
public class AcademicCareerController {

    private final StudentAcademicCareerService studentAcademicCareerService;

    public AcademicCareerController(StudentAcademicCareerService studentAcademicCareerService) {
        this.studentAcademicCareerService = studentAcademicCareerService;
    }

    @GetMapping("/options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List academic career options", description = "Returns active academic careers for admin dropdowns")
    public ResponseEntity<List<AcademicCareerOptionResponse>> getAcademicCareerOptions() {
        return ResponseEntity.ok(studentAcademicCareerService.listAcademicCareerOptions());
    }
}
