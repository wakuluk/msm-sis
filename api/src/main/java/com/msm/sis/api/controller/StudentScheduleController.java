package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.student.schedule.StudentScheduleResponse;
import com.msm.sis.api.service.student.StudentScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/schedule")
@RequiredArgsConstructor
@Tag(name = "Student Schedule", description = "Student-facing schedule endpoints")
public class StudentScheduleController {
    private final StudentScheduleService studentScheduleService;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Get my student schedule",
            description = "Returns term options, scheduled courses, dropped or withdrawn historical courses, and calendar meetings for the authenticated student. Optional termId selects a previous or current term from the student's local enrollment activity."
    )
    public ResponseEntity<StudentScheduleResponse> getMySchedule(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(required = false) Long termId
    ) {
        return ResponseEntity.ok(studentScheduleService.getScheduleForAuthenticatedStudent(
                jwt.getUserId(),
                termId
        ));
    }
}
