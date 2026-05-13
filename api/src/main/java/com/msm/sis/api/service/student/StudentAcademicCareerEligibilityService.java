package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.AcademicCareer;
import com.msm.sis.api.entity.AcademicCareerRegistrationDivision;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.StudentAcademicCareer;
import com.msm.sis.api.repository.AcademicCareerRegistrationDivisionRepository;
import com.msm.sis.api.repository.StudentAcademicCareerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
public class StudentAcademicCareerEligibilityService {
    private static final Set<String> REGISTRATION_ELIGIBLE_STATUSES = Set.of("ACTIVE");

    private final StudentAcademicCareerRepository studentAcademicCareerRepository;
    private final AcademicCareerRegistrationDivisionRepository registrationDivisionRepository;

    public StudentAcademicCareerEligibilityService(
            StudentAcademicCareerRepository studentAcademicCareerRepository,
            AcademicCareerRegistrationDivisionRepository registrationDivisionRepository
    ) {
        this.studentAcademicCareerRepository = studentAcademicCareerRepository;
        this.registrationDivisionRepository = registrationDivisionRepository;
    }

    @Transactional(readOnly = true)
    public Set<String> getAllowedAcademicDivisionCodes(Long studentId) {
        requirePositiveId(studentId, "Student id");

        return findAllowedAcademicDivisionCodes(getEligibleAcademicCareers(studentId));
    }

    @Transactional(readOnly = true)
    public Map<Long, List<AcademicDivision>> getAllowedAcademicDivisionsByStudentId(List<Long> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            return Map.of();
        }

        LinkedHashSet<Long> normalizedStudentIds = new LinkedHashSet<>();
        for (Long studentId : studentIds) {
            normalizedStudentIds.add(requirePositiveId(studentId, "Student id"));
        }

        Map<Long, List<AcademicDivision>> academicDivisionsByStudentId = new LinkedHashMap<>();
        for (Long studentId : normalizedStudentIds) {
            academicDivisionsByStudentId.put(studentId, new ArrayList<>());
        }

        studentAcademicCareerRepository.findActiveCareerAcademicDivisionsByStudentIds(
                List.copyOf(normalizedStudentIds)
        ).forEach(row -> {
            AcademicDivision academicDivision = row.getAcademicDivision();
            if (academicDivision == null) {
                return;
            }

            List<AcademicDivision> academicDivisions = academicDivisionsByStudentId.computeIfAbsent(
                    row.getStudentId(),
                    ignored -> new ArrayList<>()
            );
            boolean alreadyPresent = academicDivisions.stream()
                    .anyMatch(existingDivision -> academicDivision.getId() != null
                            && academicDivision.getId().equals(existingDivision.getId()));
            if (!alreadyPresent) {
                academicDivisions.add(academicDivision);
            }
        });

        Map<Long, List<AcademicDivision>> immutableAcademicDivisionsByStudentId = new LinkedHashMap<>();
        academicDivisionsByStudentId.forEach((studentId, academicDivisions) ->
                immutableAcademicDivisionsByStudentId.put(studentId, List.copyOf(academicDivisions))
        );
        return Collections.unmodifiableMap(immutableAcademicDivisionsByStudentId);
    }

    private Set<String> findAllowedAcademicDivisionCodes(List<StudentAcademicCareer> eligibleAcademicCareers) {
        List<Long> eligibleAcademicCareerIds = eligibleAcademicCareers.stream()
                .map(StudentAcademicCareer::getAcademicCareer)
                .filter(academicCareer -> academicCareer != null && academicCareer.getId() != null)
                .map(AcademicCareer::getId)
                .distinct()
                .toList();

        if (eligibleAcademicCareerIds.isEmpty()) {
            return Set.of();
        }

        return registrationDivisionRepository.findAllForAcademicCareers(eligibleAcademicCareerIds)
                .stream()
                .map(AcademicCareerRegistrationDivision::getAcademicDivision)
                .map(AcademicDivision::getCode)
                .map(this::normalizeCode)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Transactional(readOnly = true)
    public boolean canRegisterForAcademicDivision(Long studentId, String academicDivisionCode) {
        String normalizedAcademicDivisionCode = normalizeRequiredCode(
                academicDivisionCode,
                "Academic division code"
        );

        return getAllowedAcademicDivisionCodes(studentId).contains(normalizedAcademicDivisionCode);
    }

    @Transactional(readOnly = true)
    public void validateCanRegisterForAcademicDivision(Long studentId, String academicDivisionCode) {
        String validationMessage = findRegistrationEligibilityMessage(studentId, academicDivisionCode);

        if (validationMessage != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validationMessage);
        }
    }

    @Transactional(readOnly = true)
    public String findRegistrationEligibilityMessage(Long studentId, String academicDivisionCode) {
        requirePositiveId(studentId, "Student id");

        String normalizedAcademicDivisionCode = normalizeCode(academicDivisionCode);
        if (normalizedAcademicDivisionCode == null) {
            return "Course section academic division is required.";
        }

        if (getAllowedAcademicDivisionCodes(studentId).contains(normalizedAcademicDivisionCode)) {
            return null;
        }

        return "This student's "
                + formatStatusContext(studentId)
                + " will not allow registration for "
                + normalizedAcademicDivisionCode.toLowerCase(Locale.ROOT)
                + " level courses.";
    }

    private List<StudentAcademicCareer> getEligibleAcademicCareers(Long studentId) {
        requirePositiveId(studentId, "Student id");

        return studentAcademicCareerRepository.findAllForStudent(studentId)
                .stream()
                .filter(this::isRegistrationEligibleCareer)
                .toList();
    }

    private String formatStatusContext(Long studentId) {
        List<String> careerNames = getEligibleAcademicCareers(studentId)
                .stream()
                .map(StudentAcademicCareer::getAcademicCareer)
                .map(this::academicCareerDisplayName)
                .filter(name -> name != null)
                .distinct()
                .toList();

        if (careerNames.isEmpty()) {
            return "status";
        }

        return "status as " + joinHumanReadable(careerNames);
    }

    private String academicCareerDisplayName(AcademicCareer academicCareer) {
        if (academicCareer == null) {
            return null;
        }

        String code = trimToNull(academicCareer.getCode());
        String name = trimToNull(academicCareer.getName());
        String displayName = code == null ? name : code;
        return displayName == null ? null : displayName.toLowerCase(Locale.ROOT);
    }

    private String joinHumanReadable(List<String> values) {
        if (values.size() == 1) {
            return values.getFirst();
        }

        return String.join(" and ", values);
    }

    private boolean isRegistrationEligibleCareer(StudentAcademicCareer studentAcademicCareer) {
        String normalizedStatus = normalizeCode(studentAcademicCareer.getStatus());

        return REGISTRATION_ELIGIBLE_STATUSES.contains(normalizedStatus)
                && studentAcademicCareer.getEffectiveEndDate() == null;
    }

    private String normalizeRequiredCode(String value, String label) {
        String normalizedCode = normalizeCode(value);
        if (normalizedCode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required.");
        }

        return normalizedCode;
    }

    private String normalizeCode(String value) {
        String trimmedValue = trimToNull(value);
        return trimmedValue == null ? null : trimmedValue.toUpperCase(Locale.ROOT);
    }
}
