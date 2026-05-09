package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.instructor.schedule.InstructorScheduleSearchCriteria;
import com.msm.sis.api.dto.instructor.schedule.InstructorScheduleSearchResponse;
import com.msm.sis.api.service.instructor.InstructorScheduleSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Instructor Schedules", description = "Instructor schedule search and detail endpoints")
public class InstructorScheduleController {
    private final InstructorScheduleSearchService instructorScheduleSearchService;

    public InstructorScheduleController(InstructorScheduleSearchService instructorScheduleSearchService) {
        this.instructorScheduleSearchService = instructorScheduleSearchService;
    }

    @GetMapping("/instructor-schedules/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Search instructor schedules",
            description = "Returns paged instructor assignment rows for course sections. Admin users can search all section statuses, including draft sections."
    )
    public ResponseEntity<InstructorScheduleSearchResponse> searchInstructorSchedules(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute InstructorScheduleSearchCriteria criteria
    ) {
        return ResponseEntity.ok(instructorScheduleSearchService.searchAdminSchedules(criteria));
    }

    @GetMapping("/instructor-schedules/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get an instructor schedule",
            description = "Returns paged instructor assignment rows for a requested instructor user. Admin users can view all section statuses, including draft sections."
    )
    public ResponseEntity<InstructorScheduleSearchResponse> getInstructorSchedule(
            @PathVariable Long userId,
            @ModelAttribute InstructorScheduleSearchCriteria criteria
    ) {
        return ResponseEntity.ok(instructorScheduleSearchService.searchSchedulesForInstructorUser(
                userId,
                criteria
        ));
    }

    @GetMapping("/me/instructor-schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'DEPARTMENT_HEAD', 'ADJUNCT', 'TEACHING_ASSISTANT')")
    @Operation(
            summary = "Get my instructor schedule",
            description = "Returns paged non-draft section assignments for the authenticated staff member. Draft sections are hidden from this view."
    )
    public ResponseEntity<InstructorScheduleSearchResponse> getMyInstructorSchedule(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @ModelAttribute InstructorScheduleSearchCriteria criteria
    ) {
        return ResponseEntity.ok(instructorScheduleSearchService.searchVisibleSchedulesForCurrentUser(
                jwt.getUserId(),
                criteria
        ));
    }
}
