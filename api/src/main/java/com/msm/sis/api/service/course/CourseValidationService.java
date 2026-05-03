package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CreateAssociatedLabCourseRequest;
import com.msm.sis.api.dto.course.CreateCourseRequest;
import com.msm.sis.api.dto.course.CreateCourseVersionRequest;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class CourseValidationService {
    private final CourseRepository courseRepository;

    public void validateCreateCourseRequest(CreateCourseRequest request) {
        requireRequestBody(request);

        requirePositiveId(request.subjectId(), "Subject id");

        if (request.courseNumber() == null || request.courseNumber().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course number is required.");
        }

        if (request.lab() != null && request.lab()) {
            validateLabCourseNumber(request.courseNumber(), "Lab course number");
        }

        validateCreateCourseVersionRequest(request.initialVersion());
        validateCreateAssociatedLabRequest(request);
    }

    public void validateCourseNumberAvailable(AcademicSubject subject, String courseNumber) {
        if (courseRepository.existsBySubject_CodeAndCourseNumber(subject.getCode(), courseNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A course with this subject and course number already exists."
            );
        }
    }

    public void validateAssociatedLabCourseNumberAvailable(
            AcademicSubject subject,
            CreateAssociatedLabCourseRequest associatedLab
    ) {
        if (associatedLab == null) {
            return;
        }

        String labCourseNumber = associatedLab.courseNumber().trim();
        if (courseRepository.existsBySubject_CodeAndCourseNumber(subject.getCode(), labCourseNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A lab course with this subject and course number already exists."
            );
        }
    }

    public void validateCreateCourseVersionRequest(CreateCourseVersionRequest request) {
        requireRequestBody(request);

        BigDecimal minCredits = request.minCredits();
        BigDecimal maxCredits = request.maxCredits();

        if (request.variableCredit()) {
            if (minCredits.compareTo(maxCredits) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Min credits must be less than or equal to max credits for variable-credit courses."
                );
            }
            return;
        }

        if (minCredits.compareTo(maxCredits) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Min credits and max credits must match for non-variable-credit courses."
            );
        }
    }

    private void validateCreateAssociatedLabRequest(CreateCourseRequest request) {
        CreateAssociatedLabCourseRequest associatedLab = request.associatedLab();
        if (associatedLab == null) {
            return;
        }

        if (request.lab() != null && request.lab()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A lab course cannot create another associated lab."
            );
        }

        if (associatedLab.courseNumber() == null || associatedLab.courseNumber().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Associated lab course number is required.");
        }

        validateLabCourseNumber(associatedLab.courseNumber(), "Associated lab course number");

        if (request.courseNumber() != null
                && request.courseNumber().trim().equalsIgnoreCase(associatedLab.courseNumber().trim())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Associated lab course number must be different from the main course number."
            );
        }

        validateCreateCourseVersionRequest(associatedLab.initialVersion());
    }

    private void validateLabCourseNumber(String courseNumber, String label) {
        if (!courseNumber.trim().toUpperCase().endsWith("L")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must end with L.");
        }
    }
}
