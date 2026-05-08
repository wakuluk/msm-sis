package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.course.CourseVersionDetailResponse;
import com.msm.sis.api.dto.student.program.ExploreStudentProgramRequest;
import com.msm.sis.api.dto.student.program.StudentProgramsResponse;
import com.msm.sis.api.dto.student.program.assignment.StudentProgramAssignmentSearchCriteria;
import com.msm.sis.api.dto.student.program.assignment.StudentProgramAssignmentSearchResponse;
import com.msm.sis.api.dto.student.program.planner.ReplaceAcademicPlanPlaceholderCourseRequest;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanDraftRequest;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanResponse;
import com.msm.sis.api.dto.student.program.request.ProgramRequestReviewActionRequest;
import com.msm.sis.api.dto.student.program.request.StudentProgramRequestDetailResponse;
import com.msm.sis.api.dto.student.program.request.StudentProgramRequestQueueResponse;
import com.msm.sis.api.dto.student.program.request.StudentProgramReviewDetailResponse;
import com.msm.sis.api.service.student.StudentProgramAssignmentSearchService;
import com.msm.sis.api.service.course.CourseService;
import com.msm.sis.api.service.student.StudentAcademicPlanService;
import com.msm.sis.api.service.student.StudentProgramExplorationService;
import com.msm.sis.api.service.student.StudentProgramRequestReviewService;
import com.msm.sis.api.service.student.StudentProgramTrackerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Student Programs", description = "Student program tracker endpoints")
public class StudentProgramTrackerController {
    private final StudentProgramTrackerService studentProgramTrackerService;
    private final StudentProgramExplorationService studentProgramExplorationService;
    private final StudentProgramAssignmentSearchService studentProgramAssignmentSearchService;
    private final StudentProgramRequestReviewService studentProgramRequestReviewService;
    private final StudentAcademicPlanService studentAcademicPlanService;
    private final CourseService courseService;

    @GetMapping("/students/programs")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get current student programs", description = "Returns the authenticated student's program tracker.")
    public ResponseEntity<StudentProgramsResponse> getCurrentStudentPrograms(
            @AuthenticationPrincipal AuthenticatedJwt jwt
    ) {
        return ResponseEntity.ok(studentProgramTrackerService.getProgramsForAuthenticatedStudent(jwt.getUserId()));
    }

    @GetMapping("/me/programs")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get current student programs", description = "Returns the authenticated student's program tracker.")
    public ResponseEntity<StudentProgramsResponse> getMyPrograms(
            @AuthenticationPrincipal AuthenticatedJwt jwt
    ) {
        return getCurrentStudentPrograms(jwt);
    }

    @PostMapping("/me/programs/explore")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Explore program",
            description = "Adds a published program to the authenticated student's tracker as an explored program."
    )
    public ResponseEntity<StudentProgramsResponse> exploreProgram(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody ExploreStudentProgramRequest request
    ) {
        return ResponseEntity.ok(studentProgramExplorationService.exploreProgramForAuthenticatedStudent(
                jwt.getUserId(),
                request
        ));
    }

    @DeleteMapping("/me/programs/{studentProgramId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Remove explored program",
            description = "Removes an explored program from the authenticated student's tracker."
    )
    public ResponseEntity<StudentProgramsResponse> removeExploredProgram(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long studentProgramId
    ) {
        return ResponseEntity.ok(studentProgramExplorationService.removeExploredProgramForAuthenticatedStudent(
                jwt.getUserId(),
                studentProgramId
        ));
    }

    @PostMapping("/me/programs/{studentProgramId}/request")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Request explored program",
            description = "Submits an explored program as a student program request."
    )
    public ResponseEntity<StudentProgramsResponse> requestExploredProgram(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long studentProgramId
    ) {
        return ResponseEntity.ok(studentProgramExplorationService.requestExploredProgramForAuthenticatedStudent(
                jwt.getUserId(),
                studentProgramId
        ));
    }

    @GetMapping("/me/courses/{courseId}/latest-version")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Get latest course version for current student",
            description = "Returns latest catalog version details and requisites for a course shown in the authenticated student's program tracker."
    )
    public ResponseEntity<CourseVersionDetailResponse> getLatestCourseVersionForMyPrograms(
            @PathVariable Long courseId
    ) {
        return ResponseEntity.ok(courseService.getLatestCourseVersionForCourseId(courseId));
    }

    @PutMapping("/students/academic-plan")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Save current student academic plan", description = "Replaces the authenticated student's saved academic plan.")
    public ResponseEntity<StudentAcademicPlanResponse> saveCurrentStudentAcademicPlan(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody StudentAcademicPlanDraftRequest request
    ) {
        return ResponseEntity.ok(studentAcademicPlanService.savePlanForAuthenticatedStudent(jwt.getUserId(), request));
    }

    @PutMapping("/me/academic-plan")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Save current student academic plan", description = "Replaces the authenticated student's saved academic plan.")
    public ResponseEntity<StudentAcademicPlanResponse> saveMyAcademicPlan(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody StudentAcademicPlanDraftRequest request
    ) {
        return saveCurrentStudentAcademicPlan(jwt, request);
    }

    @PostMapping("/me/academic-plan/preview")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Preview current student academic plan",
            description = "Evaluates an academic plan draft for the authenticated student without saving it."
    )
    public ResponseEntity<StudentProgramsResponse> previewMyAcademicPlan(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody StudentAcademicPlanDraftRequest request
    ) {
        return ResponseEntity.ok(studentProgramTrackerService.previewProgramsForAuthenticatedStudent(
                jwt.getUserId(),
                request
        ));
    }

    @PatchMapping("/me/academic-plan/courses/{studentAcademicPlanCourseId}/replace-placeholder")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Replace academic plan placeholder course",
            description = "Replaces one placeholder planner row with a real catalog course for the authenticated student."
    )
    public ResponseEntity<StudentAcademicPlanResponse> replaceMyAcademicPlanPlaceholderCourse(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long studentAcademicPlanCourseId,
            @Valid @NotNull @RequestBody ReplaceAcademicPlanPlaceholderCourseRequest request
    ) {
        return ResponseEntity.ok(studentAcademicPlanService.replacePlaceholderCourseForAuthenticatedStudent(
                jwt.getUserId(),
                studentAcademicPlanCourseId,
                request
        ));
    }

    @GetMapping("/students/{studentId}/programs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get student programs by id", description = "Returns a student's program tracker by student id.")
    public ResponseEntity<StudentProgramsResponse> getStudentProgramsById(
            @NotNull @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(studentProgramTrackerService.getProgramsForStudent(studentId));
    }

    @PatchMapping("/students/{studentId}/academic-plan/courses/{studentAcademicPlanCourseId}/replace-placeholder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Replace student academic plan placeholder course",
            description = "Replaces one placeholder planner row with a real catalog course for a student."
    )
    public ResponseEntity<StudentAcademicPlanResponse> replaceStudentAcademicPlanPlaceholderCourse(
            @NotNull @PathVariable Long studentId,
            @NotNull @PathVariable Long studentAcademicPlanCourseId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody ReplaceAcademicPlanPlaceholderCourseRequest request
    ) {
        return ResponseEntity.ok(studentAcademicPlanService.replacePlaceholderCourse(
                studentId,
                studentAcademicPlanCourseId,
                request,
                jwt.getUserId()
        ));
    }

    @PutMapping("/students/{studentId}/academic-plan")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Save student academic plan by id", description = "Replaces a student's saved academic plan by student id.")
    public ResponseEntity<StudentAcademicPlanResponse> saveStudentAcademicPlanById(
            @NotNull @PathVariable Long studentId,
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @NotNull @RequestBody StudentAcademicPlanDraftRequest request
    ) {
        return ResponseEntity.ok(studentAcademicPlanService.savePlan(studentId, request, jwt.getUserId()));
    }

    @PostMapping("/students/{studentId}/academic-plan/preview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Preview student academic plan",
            description = "Evaluates a student's academic plan draft without saving it."
    )
    public ResponseEntity<StudentProgramsResponse> previewStudentAcademicPlanById(
            @NotNull @PathVariable Long studentId,
            @Valid @NotNull @RequestBody StudentAcademicPlanDraftRequest request
    ) {
        return ResponseEntity.ok(studentProgramTrackerService.previewProgramsForStudent(studentId, request));
    }

    @GetMapping("/program-requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get program request queue",
            description = "Returns student program requests awaiting department or admin review."
    )
    public ResponseEntity<StudentProgramRequestQueueResponse> getProgramRequestQueue(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) String studentQuery,
            @RequestParam(required = false) String programQuery,
            @RequestParam(required = false) Long programTypeId,
            @RequestParam(required = false) Long degreeTypeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classStandingId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate requestedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate requestedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "requestedAt") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(studentProgramRequestReviewService.getProgramRequestQueue(
                departmentId,
                status,
                studentQuery,
                programQuery,
                programTypeId,
                degreeTypeId,
                schoolId,
                classStandingId,
                requestedFrom,
                requestedTo,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }

    @GetMapping("/me/program-requests/department")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_HEAD')")
    @Operation(
            summary = "Get my department program request queue",
            description = "Returns student program requests for departments where the authenticated user is an active department head."
    )
    public ResponseEntity<StudentProgramRequestQueueResponse> getMyDepartmentProgramRequestQueue(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) String studentQuery,
            @RequestParam(required = false) String programQuery,
            @RequestParam(required = false) Long programTypeId,
            @RequestParam(required = false) Long degreeTypeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classStandingId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate requestedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate requestedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "requestedAt") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(studentProgramRequestReviewService.getDepartmentHeadProgramRequestQueue(
                jwt.getUserId(),
                status,
                studentQuery,
                programQuery,
                programTypeId,
                degreeTypeId,
                schoolId,
                classStandingId,
                requestedFrom,
                requestedTo,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }

    @GetMapping("/me/student-programs/department/majors")
    @PreAuthorize("hasRole('DEPARTMENT_HEAD')")
    @Operation(
            summary = "Search my department major students",
            description = "Returns students attached to major programs in departments where the authenticated user is an active department head."
    )
    public ResponseEntity<StudentProgramAssignmentSearchResponse> searchMyDepartmentMajorStudents(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute StudentProgramAssignmentSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "student") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(studentProgramAssignmentSearchService.searchDepartmentHeadMajorAssignments(
                jwt.getUserId(),
                criteria,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }

    @GetMapping("/student-programs/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search student program assignments",
            description = "Returns students attached to non-exploratory programs across all departments."
    )
    public ResponseEntity<StudentProgramAssignmentSearchResponse> searchStudentProgramAssignments(
            @ModelAttribute StudentProgramAssignmentSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "student") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(studentProgramAssignmentSearchService.searchAssignments(
                criteria,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }

    @GetMapping("/program-requests/{studentProgramRequestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_HEAD')")
    @Operation(
            summary = "Get program request detail",
            description = "Returns request summary plus the student's program tracker for review."
    )
    public ResponseEntity<StudentProgramRequestDetailResponse> getProgramRequestDetail(
            @PathVariable Long studentProgramRequestId
    ) {
        return ResponseEntity.ok(studentProgramRequestReviewService.getProgramRequestDetail(studentProgramRequestId));
    }

    @GetMapping("/student-programs/{studentProgramId}/review-detail")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_HEAD')")
    @Operation(
            summary = "Get student program review detail",
            description = "Returns assigned program detail plus latest request history and the student's read-only tracker."
    )
    public ResponseEntity<StudentProgramReviewDetailResponse> getStudentProgramReviewDetail(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long studentProgramId
    ) {
        return ResponseEntity.ok(studentProgramRequestReviewService.getStudentProgramReviewDetail(
                studentProgramId,
                jwt.getUserId(),
                jwt.getRoles()
        ));
    }

    @PostMapping("/program-requests/{studentProgramRequestId}/department-approve")
    @PreAuthorize("hasRole('DEPARTMENT_HEAD')")
    @Operation(
            summary = "Department approve program request",
            description = "Marks a requested program as department approved and ready for admin review."
    )
    public ResponseEntity<StudentProgramRequestDetailResponse> departmentApproveProgramRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long studentProgramRequestId,
            @Valid @RequestBody(required = false) ProgramRequestReviewActionRequest request
    ) {
        return ResponseEntity.ok(studentProgramRequestReviewService.approveDepartmentReview(
                studentProgramRequestId,
                request,
                jwt.getUserId()
        ));
    }

    @PostMapping("/program-requests/{studentProgramRequestId}/admin-approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Admin approve program request",
            description = "Finalizes a requested program and activates it on the student record."
    )
    public ResponseEntity<StudentProgramRequestDetailResponse> adminApproveProgramRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long studentProgramRequestId,
            @Valid @RequestBody(required = false) ProgramRequestReviewActionRequest request
    ) {
        return ResponseEntity.ok(studentProgramRequestReviewService.approveAdminReview(
                studentProgramRequestId,
                request,
                jwt.getUserId()
        ));
    }

    @PostMapping("/program-requests/{studentProgramRequestId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_HEAD')")
    @Operation(
            summary = "Reject program request",
            description = "Rejects a requested program. A rejection comment is required."
    )
    public ResponseEntity<StudentProgramRequestDetailResponse> rejectProgramRequest(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long studentProgramRequestId,
            @Valid @NotNull @RequestBody ProgramRequestReviewActionRequest request
    ) {
        return ResponseEntity.ok(studentProgramRequestReviewService.rejectProgramRequest(
                studentProgramRequestId,
                request,
                jwt.getUserId(),
                jwt.getRoles()
        ));
    }
}
