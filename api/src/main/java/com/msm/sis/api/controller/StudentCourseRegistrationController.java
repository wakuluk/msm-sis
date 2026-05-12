package com.msm.sis.api.controller;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.registration.course.AddStudentCourseRegistrationSelectionRequest;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationGroupChoicesResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationSubmitResponse;
import com.msm.sis.api.dto.registration.course.StudentCourseSectionSearchResponse;
import com.msm.sis.api.dto.registration.course.SubmitStudentCourseRegistrationRequest;
import com.msm.sis.api.service.registration.StudentCourseRegistrationContextService;
import com.msm.sis.api.service.registration.StudentCourseRegistrationService;
import com.msm.sis.api.service.registration.StudentCourseSectionSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me/course-registration")
@RequiredArgsConstructor
@Tag(name = "Student Course Registration", description = "Student-facing course registration endpoints")
public class StudentCourseRegistrationController {
    private final StudentCourseRegistrationContextService courseRegistrationContextService;
    private final StudentCourseRegistrationService courseRegistrationService;
    private final StudentCourseSectionSearchService courseSectionSearchService;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Get student course registration",
            description = "Returns the registration window, selected courses, enrolled/waitlisted courses, and schedule meetings for the authenticated student. Optional registrationGroupId or termId query parameters select a specific viewable registration group."
    )
    public ResponseEntity<StudentCourseRegistrationResponse> getCourseRegistration(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(required = false) Long registrationGroupId,
            @RequestParam(required = false) Long termId
    ) {
        return ResponseEntity.ok(courseRegistrationService.getCourseRegistrationForAuthenticatedStudent(
                jwt.getUserId(),
                registrationGroupId,
                termId
        ));
    }

    @GetMapping("/groups")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Get student course registration group choices",
            description = "Returns published and closed registration groups assigned to the authenticated student for term selection."
    )
    public ResponseEntity<StudentCourseRegistrationGroupChoicesResponse> getCourseRegistrationGroupChoices(
            @AuthenticationPrincipal AuthenticatedJwt jwt
    ) {
        return ResponseEntity.ok(
                courseRegistrationContextService.getRegistrationGroupChoicesForAuthenticatedStudent(
                        jwt.getUserId()
                )
        );
    }

    @PostMapping("/selections")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Add a course registration selection",
            description = "Adds a pre-registered section selection for the authenticated student after validating term access, duplicate enrollment, credits, grading basis, and prerequisites."
    )
    public ResponseEntity<StudentCourseRegistrationResponse> addSelection(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @Valid @RequestBody AddStudentCourseRegistrationSelectionRequest request,
            @RequestParam(required = false) Long registrationGroupId,
            @RequestParam(required = false) Long termId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                courseRegistrationService.addSelectionForAuthenticatedStudent(
                        jwt.getUserId(),
                        request,
                        registrationGroupId,
                        termId
                )
        );
    }

    @DeleteMapping("/selections/{selectionId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Remove a course registration selection",
            description = "Deletes a pre-registered section selection for the authenticated student when it belongs to their current registration group."
    )
    public ResponseEntity<StudentCourseRegistrationResponse> removeSelection(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long selectionId,
            @RequestParam(required = false) Long registrationGroupId,
            @RequestParam(required = false) Long termId
    ) {
        return ResponseEntity.ok(courseRegistrationService.removeSelectionForAuthenticatedStudent(
                jwt.getUserId(),
                selectionId,
                registrationGroupId,
                termId
        ));
    }

    @DeleteMapping("/enrollments/{enrollmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Remove a course registration enrollment",
            description = "Deletes the authenticated student's enrollment from their selected registration group term while the registration window is open."
    )
    public ResponseEntity<StudentCourseRegistrationResponse> removeEnrollment(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long enrollmentId,
            @RequestParam(required = false) Long registrationGroupId,
            @RequestParam(required = false) Long termId
    ) {
        return ResponseEntity.ok(courseRegistrationService.removeEnrollmentForAuthenticatedStudent(
                jwt.getUserId(),
                enrollmentId,
                registrationGroupId,
                termId
        ));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Submit selected courses for registration",
            description = "Converts pre-registered selections into enrolled or waitlisted section enrollments when the student's registration window is open."
    )
    public ResponseEntity<StudentCourseRegistrationSubmitResponse> registerSelections(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestBody(required = false) SubmitStudentCourseRegistrationRequest request,
            @RequestParam(required = false) Long registrationGroupId,
            @RequestParam(required = false) Long termId
    ) {
        return ResponseEntity.ok(courseRegistrationService.submitRegistrationForAuthenticatedStudent(
                jwt.getUserId(),
                request,
                registrationGroupId,
                termId
        ));
    }

    @PostMapping("/waitlist-offers/{offerId}/accept")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Accept a waitlist offer",
            description = "Moves the authenticated student's active waitlist offer from waitlisted to registered when the offer is still active."
    )
    public ResponseEntity<StudentCourseRegistrationResponse> acceptWaitlistOffer(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long offerId
    ) {
        return ResponseEntity.ok(courseRegistrationService.acceptWaitlistOfferForAuthenticatedStudent(
                jwt.getUserId(),
                offerId
        ));
    }

    @PostMapping("/waitlist-offers/by-enrollment/{enrollmentId}/accept")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Accept a waitlist offer by enrollment",
            description = "Moves the authenticated student's active waitlist offer from waitlisted to registered using the waitlisted enrollment id."
    )
    public ResponseEntity<StudentCourseRegistrationResponse> acceptWaitlistOfferByEnrollment(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @PathVariable Long enrollmentId
    ) {
        return ResponseEntity.ok(courseRegistrationService.acceptWaitlistOfferForEnrollmentForAuthenticatedStudent(
                jwt.getUserId(),
                enrollmentId
        ));
    }

    @GetMapping("/course-sections")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Search course sections for current student registration",
            description = "Returns sections in the authenticated student's published registration group term, excluding draft and cancelled sections."
    )
    public ResponseEntity<StudentCourseSectionSearchResponse> searchCourseSections(
            @AuthenticationPrincipal AuthenticatedJwt jwt,
            @RequestParam(required = false) Long termId,
            @RequestParam(required = false) List<Long> subTermIds,
            @RequestParam(required = false) String courseCode,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String instructor,
            @RequestParam(required = false) List<Short> dayOfWeeks,
            @RequestParam(required = false) Integer startHour,
            @RequestParam(required = false) String time,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "courseCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        return ResponseEntity.ok(courseSectionSearchService.searchCourseSectionsForAuthenticatedStudent(
                jwt.getUserId(),
                termId,
                subTermIds,
                courseCode,
                section,
                instructor,
                dayOfWeeks,
                startHour,
                time,
                page,
                size,
                sortBy,
                sortDirection
        ));
    }
}
