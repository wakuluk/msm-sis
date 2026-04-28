package com.msm.sis.api.controller;

import com.msm.sis.api.dto.academic.AcademicSchoolDepartmentSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.catalog.CatalogAdvancedSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.catalog.CatalogSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.course.CoursePickerReferenceOptionsResponse;
import com.msm.sis.api.dto.course.CourseSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.reference.CourseSectionReferenceOptionsResponse;
import com.msm.sis.api.dto.student.StudentReferenceOptionsResponse;
import com.msm.sis.api.service.ReferenceDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@RestController
@RequestMapping("/api/reference")
@Tag(name = "Reference Data", description = "Reference data endpoints")
public class ReferenceController {

    private static final String CATALOG_UNAVAILABLE_MESSAGE =
            "Catalog search is temporarily unavailable while academic year and term status are being redesigned.";

    private final ReferenceDataService referenceDataService;

    public ReferenceController(ReferenceDataService referenceDataService) {
        this.referenceDataService = referenceDataService;
    }

    @GetMapping("/student-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get student reference options", description = "Returns reference options used by student detail forms")
    public ResponseEntity<StudentReferenceOptionsResponse> getStudentReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getStudentReferenceOptions());
    }

    @GetMapping("/academic-school-department-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get academic school and department reference options",
            description = "Returns active academic schools and departments used by academic search filters."
    )
    public ResponseEntity<AcademicSchoolDepartmentSearchReferenceOptionsResponse>
    getAcademicSchoolDepartmentReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getAcademicSchoolDepartmentSearchReferenceOptions());
    }

    @GetMapping("/course-search-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get course search reference options",
            description = "Returns active academic schools, departments, and subjects used by course search filters."
    )
    public ResponseEntity<CourseSearchReferenceOptionsResponse> getCourseSearchReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getCourseSearchReferenceOptions());
    }

    @GetMapping("/course-picker-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get course picker reference options",
            description = "Returns eligible courses with current versions, plus school, department, and subject filters for the add-offering workflow."
    )
    public ResponseEntity<CoursePickerReferenceOptionsResponse> getCoursePickerReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getCoursePickerReferenceOptions());
    }

    @GetMapping("/course-section-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get course section reference options",
            description = "Returns active section statuses, divisions, delivery modes, grading bases, meeting types, instructor roles, enrollment statuses, grade types, and grade marks."
    )
    public ResponseEntity<CourseSectionReferenceOptionsResponse> getCourseSectionReferenceOptions() {
        return ResponseEntity.ok(referenceDataService.getCourseSectionReferenceOptions());
    }

    @GetMapping("/catalog-search-options")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get catalog search reference options", description = "Returns academic years, sub terms, departments, subjects, and status options used by catalog search filters")
    public ResponseEntity<CatalogSearchReferenceOptionsResponse> getCatalogSearchReferenceOptions() {
        throw catalogUnavailableException();
    }

    @GetMapping("/catalog-advanced-search-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get catalog search reference options", description = "Returns academic years, sub terms, departments, subjects, and status options used by catalog search filters")
    public ResponseEntity<CatalogAdvancedSearchReferenceOptionsResponse> getCatalogAdvancedSearchReferenceOptions() {
        throw catalogUnavailableException();
    }

    private ResponseStatusException catalogUnavailableException() {
        return new ResponseStatusException(SERVICE_UNAVAILABLE, CATALOG_UNAVAILABLE_MESSAGE);
    }
}
