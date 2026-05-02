package com.msm.sis.api.service.course;

import com.msm.sis.api.entity.GradeMark;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionGradeType;
import com.msm.sis.api.repository.GradeMarkRepository;
import com.msm.sis.api.repository.GradingBasisRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentStatusRepository;
import com.msm.sis.api.repository.StudentSectionGradeTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Optional;
import java.util.function.Function;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requireGreaterThanZero;

@Service
@RequiredArgsConstructor
public class StudentSectionEnrollmentReferenceResolver {
    private final GradeMarkRepository gradeMarkRepository;
    private final GradingBasisRepository gradingBasisRepository;
    private final SisUserRepository sisUserRepository;
    private final StudentSectionEnrollmentStatusRepository enrollmentStatusRepository;
    private final StudentSectionGradeTypeRepository gradeTypeRepository;

    public StudentSectionEnrollmentStatus resolveEnrollmentStatus(String code) {
        return resolveRequiredReference(
                code,
                enrollmentStatusRepository::findByCode,
                "Student section enrollment status"
        );
    }

    public GradingBasis resolveGradingBasis(String code) {
        GradingBasis gradingBasis = resolveRequiredReference(code, gradingBasisRepository::findByCode, "Grading basis");
        if (!gradingBasis.isAllowedForStudentEnrollments()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected grading basis cannot be used for a student enrollment."
            );
        }
        return gradingBasis;
    }

    public StudentSectionGradeType resolveGradeType(String code) {
        return resolveRequiredReference(code, gradeTypeRepository::findByCode, "Grade type");
    }

    public GradeMark resolveGradeMark(String code) {
        return resolveRequiredReference(code, gradeMarkRepository::findByCode, "Grade mark");
    }

    public SisUser resolveOptionalUser(Long userId) {
        if (userId == null) {
            return null;
        }
        requireGreaterThanZero(userId, "User id");
        return sisUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User id is invalid."));
    }

    private <T> T resolveRequiredReference(
            String code,
            Function<String, Optional<T>> lookup,
            String label
    ) {
        String normalizedCode = normalizeCode(code, label);
        return lookup.apply(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        label + " code is invalid."
                ));
    }

    private String normalizeCode(String code, String label) {
        String trimmedCode = trimToNull(code);

        if (trimmedCode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " code is required.");
        }

        return trimmedCode.toUpperCase(Locale.US);
    }
}
