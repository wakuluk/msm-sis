package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CreateCourseSectionInstructorRequest;
import com.msm.sis.api.dto.course.CreateCourseSectionMeetingRequest;
import com.msm.sis.api.dto.course.CreateCourseSectionRequest;
import com.msm.sis.api.dto.course.PatchCourseSectionRequest;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.repository.CourseSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class CourseSectionValidationService {
    private final CourseSectionRepository courseSectionRepository;

    public void validateCreateRequest(CreateCourseSectionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        validatePositiveId(request.subTermId(), "Academic sub term id");

        if (trimToNull(request.sectionLetter()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section letter is required.");
        }

        if (request.credits() == null || request.credits().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Credits must be zero or greater.");
        }

        if (request.capacity() == null || request.capacity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capacity must be zero or greater.");
        }

        if (
                request.startDate() != null
                        && request.endDate() != null
                        && request.startDate().isAfter(request.endDate())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Section start date must be on or before end date."
            );
        }
    }

    public void validatePatchRequest(PatchCourseSectionRequest request, CourseSection existingSection) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        if (existingSection == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Existing course section is required.");
        }

        if (request.getSubTermId().isPresent()) {
            validatePositiveId(request.getSubTermId().getValue(), "Academic sub term id");
        }

        if (
                request.getSectionLetter().isPresent()
                        && trimToNull(request.getSectionLetter().getValue()) == null
        ) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section letter cannot be blank.");
        }

        validatePresentBoolean(request.getHonors().isPresent(), request.getHonors().getValue(), "Honors");
        validatePresentBoolean(request.getLab().isPresent(), request.getLab().getValue(), "Lab");
        validatePresentBoolean(
                request.getWaitlistAllowed().isPresent(),
                request.getWaitlistAllowed().getValue(),
                "Waitlist allowed"
        );

        validatePresentRequiredCode(
                request.getStatusCode().isPresent(),
                request.getStatusCode().getValue(),
                "Course section status"
        );
        validatePresentRequiredCode(
                request.getDeliveryModeCode().isPresent(),
                request.getDeliveryModeCode().getValue(),
                "Delivery mode"
        );
        validatePresentRequiredCode(
                request.getGradingBasisCode().isPresent(),
                request.getGradingBasisCode().getValue(),
                "Grading basis"
        );

        if (
                request.getCredits().isPresent()
                        && (request.getCredits().getValue() == null
                        || request.getCredits().getValue().compareTo(BigDecimal.ZERO) < 0)
        ) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Credits must be zero or greater.");
        }

        if (
                request.getCapacity().isPresent()
                        && (request.getCapacity().getValue() == null || request.getCapacity().getValue() < 0)
        ) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capacity must be zero or greater.");
        }

        LocalDate finalStartDate = request.getStartDate().orElse(existingSection.getStartDate());
        LocalDate finalEndDate = request.getEndDate().orElse(existingSection.getEndDate());
        validateDateRange(finalStartDate, finalEndDate, "Section start date must be on or before end date.");

        if (request.getInstructors().isPresent()) {
            validateInstructorRequests(request.getInstructors().getValue());
        }

        if (request.getMeetings().isPresent()) {
            validateMeetingRequests(request.getMeetings().getValue());
        }
    }

    public void validateCredits(CourseOffering courseOffering, BigDecimal credits) {
        CourseVersion courseVersion = courseOffering.getCourseVersion();

        if (courseVersion == null) {
            return;
        }

        if (credits.compareTo(courseVersion.getMinCredits()) < 0
                || credits.compareTo(courseVersion.getMaxCredits()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Credits must be within the course offering credit range."
            );
        }

        if (!courseVersion.isVariableCredit() && credits.compareTo(courseVersion.getMinCredits()) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Credits must match the course offering credits."
            );
        }
    }

    public void validateUniqueSectionIdentity(
            Long courseOfferingId,
            Long subTermId,
            String sectionLetter,
            boolean honors,
            boolean lab
    ) {
        if (courseSectionRepository.existsByNaturalKey(
                courseOfferingId,
                subTermId,
                sectionLetter,
                honors,
                lab
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Course section already exists for this offering and sub term."
            );
        }
    }

    public void validateInstructorRequest(CreateCourseSectionInstructorRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Instructor request cannot be null.");
        }

        validatePositiveId(request.staffId(), "Instructor staff id");

        if (
                request.assignmentStartDate() != null
                        && request.assignmentEndDate() != null
                        && request.assignmentStartDate().isAfter(request.assignmentEndDate())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Instructor assignment start date must be on or before end date."
            );
        }
    }

    public void validateInstructorRequests(List<CreateCourseSectionInstructorRequest> requests) {
        if (requests == null) {
            return;
        }

        long primaryCount = requests.stream().filter(CreateCourseSectionInstructorRequest::primary).count();
        if (primaryCount > 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only one primary instructor is allowed."
            );
        }

        for (CreateCourseSectionInstructorRequest request : requests) {
            validateInstructorRequest(request);
        }
    }

    public void validateMeetingRequest(CreateCourseSectionMeetingRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meeting request cannot be null.");
        }

        if (
                request.startTime() != null
                        && request.endTime() != null
                        && !request.startTime().isBefore(request.endTime())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Meeting start time must be before end time."
            );
        }

        if (
                request.startDate() != null
                        && request.endDate() != null
                        && request.startDate().isAfter(request.endDate())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Meeting start date must be on or before end date."
            );
        }
    }

    public void validateMeetingRequests(List<CreateCourseSectionMeetingRequest> requests) {
        if (requests == null) {
            return;
        }

        for (CreateCourseSectionMeetingRequest request : requests) {
            validateMeetingRequest(request);
        }
    }

    public void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }
    }

    public void validatePositiveId(Long id, String label) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + " must be a positive number."
            );
        }
    }

    private void validatePresentBoolean(boolean present, Boolean value, String label) {
        if (present && value == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + " must be true or false."
            );
        }
    }

    private void validatePresentRequiredCode(boolean present, String value, String label) {
        if (present && trimToNull(value) == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + " code cannot be blank."
            );
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate, String message) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }
}
