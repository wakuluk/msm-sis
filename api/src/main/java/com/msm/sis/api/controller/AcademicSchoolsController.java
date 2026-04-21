package com.msm.sis.api.controller;

import com.msm.sis.api.dto.academic.AcademicSchoolResponse;
import com.msm.sis.api.dto.academic.school.AcademicSchoolDepartmentSearchCriteria;
import com.msm.sis.api.dto.academic.school.AcademicSchoolDepartmentSearchResultResponse;
import com.msm.sis.api.service.academic.AcademicSchoolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/academic-schools")
@Tag(name = "academic-schools", description = "Manage Academic Schools")
public class AcademicSchoolsController {

    private final AcademicSchoolService academicSchoolService;

    public AcademicSchoolsController(AcademicSchoolService academicSchoolService) {
        this.academicSchoolService = academicSchoolService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get academic schools",
            description = "Returns all academic schools with their nested academic departments."
    )
    public ResponseEntity<List<AcademicSchoolResponse>> getAcademicSchools() {
        return ResponseEntity.ok(academicSchoolService.getAcademicSchools());
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search academic schools",
            description = "Search academic schools with their nested academic departments."
    )
    public ResponseEntity<List<AcademicSchoolDepartmentSearchResultResponse>> searchAcademicSchools(
            @ModelAttribute AcademicSchoolDepartmentSearchCriteria criteria
    ) {
        return ResponseEntity.ok(academicSchoolService.searchAcademicSchools(criteria));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get an academic school by id",
            description = "Returns an academic schools by an id with their nested academic departments."
    )
    public ResponseEntity<AcademicSchoolResponse> getAcademicSchoolById(@PathVariable Long id) {
        return ResponseEntity.ok(academicSchoolService.getAcademicSchoolById(id));
    }
}
