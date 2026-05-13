package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.academiccareer.AcademicCareerOptionResponse;
import com.msm.sis.api.dto.student.academiccareer.AcademicCareerRegistrationDivisionResponse;
import com.msm.sis.api.dto.student.academiccareer.CreateStudentAcademicCareerRequest;
import com.msm.sis.api.dto.student.academiccareer.StudentAcademicCareerResponse;
import com.msm.sis.api.dto.student.academiccareer.UpdateStudentAcademicCareerRequest;
import com.msm.sis.api.entity.AcademicCareer;
import com.msm.sis.api.entity.AcademicCareerRegistrationDivision;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentAcademicCareer;
import com.msm.sis.api.patch.PatchValue;
import com.msm.sis.api.repository.AcademicCareerRegistrationDivisionRepository;
import com.msm.sis.api.repository.AcademicCareerRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentAcademicCareerRepository;
import com.msm.sis.api.repository.StudentRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
@RequiredArgsConstructor
public class StudentAcademicCareerService {
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final Set<String> VALID_STATUSES = Set.of(
            STATUS_ACTIVE,
            "INTENT_TO_GRADUATE",
            "GRADUATED",
            "WITHDRAWN",
            "DISMISSED",
            "LEAVE_OF_ABSENCE"
    );

    private final StudentRepository studentRepository;
    private final AcademicCareerRepository academicCareerRepository;
    private final AcademicCareerRegistrationDivisionRepository registrationDivisionRepository;
    private final StudentAcademicCareerRepository studentAcademicCareerRepository;
    private final SisUserRepository sisUserRepository;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<StudentAcademicCareerResponse> listStudentAcademicCareers(Long studentId) {
        Student student = resolveStudent(studentId);
        List<StudentAcademicCareer> studentAcademicCareers = studentAcademicCareerRepository
                .findAllForStudent(student.getId());
        Map<Long, List<AcademicCareerRegistrationDivisionResponse>> registrationDivisionsByCareerId =
                findRegistrationDivisionsByCareerId(studentAcademicCareers.stream()
                        .map(StudentAcademicCareer::getAcademicCareer)
                        .map(AcademicCareer::getId)
                        .distinct()
                        .toList());

        return studentAcademicCareers.stream()
                .map(studentAcademicCareer -> toResponse(
                        studentAcademicCareer,
                        registrationDivisionsByCareerId.getOrDefault(
                                studentAcademicCareer.getAcademicCareer().getId(),
                                List.of()
                        )
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AcademicCareerOptionResponse> listAcademicCareerOptions() {
        List<AcademicCareer> academicCareers = academicCareerRepository.findAllByActiveTrueOrderBySortOrderAscNameAsc();
        Map<Long, List<AcademicCareerRegistrationDivisionResponse>> registrationDivisionsByCareerId =
                findRegistrationDivisionsByCareerId(academicCareers.stream()
                        .map(AcademicCareer::getId)
                        .toList());

        return academicCareers.stream()
                .map(academicCareer -> new AcademicCareerOptionResponse(
                        academicCareer.getId(),
                        academicCareer.getCode(),
                        academicCareer.getName(),
                        academicCareer.isActive(),
                        registrationDivisionsByCareerId.getOrDefault(academicCareer.getId(), List.of())
                ))
                .toList();
    }

    @Transactional
    public StudentAcademicCareerResponse createStudentAcademicCareer(
            Long studentId,
            CreateStudentAcademicCareerRequest request,
            Long createdByUserId
    ) {
        Student student = resolveStudent(studentId);
        CreateStudentAcademicCareerRequest requiredRequest = requireRequestBody(request);
        AcademicCareer academicCareer = resolveActiveAcademicCareer(requiredRequest.academicCareerId());
        String status = validateStatus(requiredRequest.status());
        LocalDate effectiveStartDate = requireEffectiveStartDate(requiredRequest.effectiveStartDate());
        LocalDate effectiveEndDate = requiredRequest.effectiveEndDate();
        boolean primaryCareer = Boolean.TRUE.equals(requiredRequest.primaryCareer());

        validateDateRange(effectiveStartDate, effectiveEndDate);
        validateOptionalText(requiredRequest.entryReason(), requiredRequest.notes());
        validatePrimaryCareer(status, effectiveEndDate, primaryCareer);
        validateNoDuplicateCareerType(student.getId(), academicCareer.getId(), null);

        StudentAcademicCareer studentAcademicCareer = new StudentAcademicCareer();
        studentAcademicCareer.setStudent(student);
        studentAcademicCareer.setAcademicCareer(academicCareer);
        studentAcademicCareer.setStatus(status);
        studentAcademicCareer.setEffectiveStartDate(effectiveStartDate);
        studentAcademicCareer.setEffectiveEndDate(effectiveEndDate);
        studentAcademicCareer.setPrimaryCareer(primaryCareer);
        studentAcademicCareer.setEntryReason(trimToNull(requiredRequest.entryReason()));
        studentAcademicCareer.setNotes(trimToNull(requiredRequest.notes()));
        SisUser createdByUser = resolveUser(createdByUserId);
        studentAcademicCareer.setCreatedByUser(createdByUser);
        studentAcademicCareer.setUpdatedByUser(createdByUser);

        handlePrimaryCareerRules(student.getId(), null, primaryCareer);

        studentAcademicCareerRepository.saveAndFlush(studentAcademicCareer);
        entityManager.refresh(studentAcademicCareer);

        return toResponse(
                studentAcademicCareer,
                findRegistrationDivisions(academicCareer.getId())
        );
    }

    @Transactional
    public StudentAcademicCareerResponse updateStudentAcademicCareer(
            Long studentId,
            Long studentAcademicCareerId,
            UpdateStudentAcademicCareerRequest request,
            Long updatedByUserId
    ) {
        requireRequestBody(request);
        requirePositiveId(studentAcademicCareerId, "Student academic career id");
        StudentAcademicCareer studentAcademicCareer = studentAcademicCareerRepository
                .findForStudentById(requirePositiveId(studentId, "Student id"), studentAcademicCareerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        AcademicCareer academicCareer = studentAcademicCareer.getAcademicCareer();
        if (request.getAcademicCareerId().isPresent()) {
            academicCareer = resolveActiveAcademicCareer(request.getAcademicCareerId().getValue());
        }

        String status = request.getStatus().isPresent()
                ? validateStatus(request.getStatus().getValue())
                : studentAcademicCareer.getStatus();
        LocalDate effectiveStartDate = request.getEffectiveStartDate().isPresent()
                ? requireEffectiveStartDate(request.getEffectiveStartDate().getValue())
                : studentAcademicCareer.getEffectiveStartDate();
        LocalDate effectiveEndDate = request.getEffectiveEndDate().isPresent()
                ? request.getEffectiveEndDate().getValue()
                : studentAcademicCareer.getEffectiveEndDate();
        boolean primaryCareer = request.getPrimaryCareer().isPresent()
                ? requireBoolean(request.getPrimaryCareer(), "Primary career")
                : studentAcademicCareer.isPrimaryCareer();

        validateDateRange(effectiveStartDate, effectiveEndDate);
        validatePatchedOptionalText(request);
        validatePrimaryCareer(status, effectiveEndDate, primaryCareer);
        validateNoDuplicateCareerType(
                studentAcademicCareer.getStudent().getId(),
                academicCareer.getId(),
                studentAcademicCareer.getId()
        );

        studentAcademicCareer.setAcademicCareer(academicCareer);
        studentAcademicCareer.setStatus(status);
        studentAcademicCareer.setEffectiveStartDate(effectiveStartDate);
        studentAcademicCareer.setEffectiveEndDate(effectiveEndDate);
        studentAcademicCareer.setPrimaryCareer(primaryCareer);
        applyTrimmed(request.getEntryReason(), studentAcademicCareer::setEntryReason);
        applyTrimmed(request.getNotes(), studentAcademicCareer::setNotes);
        studentAcademicCareer.setUpdatedByUser(resolveUser(updatedByUserId));

        handlePrimaryCareerRules(
                studentAcademicCareer.getStudent().getId(),
                studentAcademicCareer.getId(),
                primaryCareer
        );

        studentAcademicCareerRepository.saveAndFlush(studentAcademicCareer);
        entityManager.refresh(studentAcademicCareer);

        return toResponse(
                studentAcademicCareer,
                findRegistrationDivisions(academicCareer.getId())
        );
    }

    private Student resolveStudent(Long studentId) {
        requirePositiveId(studentId, "Student id");

        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
    }

    private AcademicCareer resolveActiveAcademicCareer(Long academicCareerId) {
        requirePositiveId(academicCareerId, "Academic career id");

        AcademicCareer academicCareer = academicCareerRepository.findById(academicCareerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic career not found."));

        if (!academicCareer.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic career is inactive.");
        }

        return academicCareer;
    }

    private SisUser resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }

        return sisUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found."));
    }

    private String validateStatus(String status) {
        String normalizedStatus = trimToNull(status);
        if (normalizedStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic career status is required.");
        }

        normalizedStatus = normalizedStatus.toUpperCase();
        if (!VALID_STATUSES.contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic career status is invalid.");
        }

        return normalizedStatus;
    }

    private LocalDate requireEffectiveStartDate(LocalDate effectiveStartDate) {
        if (effectiveStartDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Effective start date is required.");
        }

        return effectiveStartDate;
    }

    private void validateDateRange(LocalDate effectiveStartDate, LocalDate effectiveEndDate) {
        if (effectiveEndDate != null && effectiveEndDate.isBefore(effectiveStartDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Effective end date cannot be before effective start date."
            );
        }
    }

    private void validateOptionalText(String entryReason, String notes) {
        validateMaxLength(trimToNull(entryReason), 50, "Entry reason");
        validateMaxLength(trimToNull(notes), 500, "Notes");
    }

    private void validatePatchedOptionalText(UpdateStudentAcademicCareerRequest request) {
        if (request.getEntryReason().isPresent()) {
            validateMaxLength(trimToNull(request.getEntryReason().getValue()), 50, "Entry reason");
        }

        if (request.getNotes().isPresent()) {
            validateMaxLength(trimToNull(request.getNotes().getValue()), 500, "Notes");
        }
    }

    private void validatePrimaryCareer(
            String status,
            LocalDate effectiveEndDate,
            boolean primaryCareer
    ) {
        if (!primaryCareer) {
            return;
        }

        if (!STATUS_ACTIVE.equals(status) || effectiveEndDate != null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only an open active academic career can be marked primary."
            );
        }
    }

    private void validateNoDuplicateCareerType(
            Long studentId,
            Long academicCareerId,
            Long excludedId
    ) {
        if (studentAcademicCareerRepository.existsOtherCareerTypeForStudent(
                studentId,
                academicCareerId,
                excludedId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student already has this academic career type."
            );
        }
    }

    private boolean requireBoolean(PatchValue<Boolean> value, String fieldName) {
        Boolean patchedValue = value.orElse(null);
        if (patchedValue == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }

        return patchedValue;
    }

    private void handlePrimaryCareerRules(Long studentId, Long excludedId, boolean primaryCareer) {
        if (!primaryCareer) {
            return;
        }

        List<StudentAcademicCareer> otherPrimaryCareers = studentAcademicCareerRepository
                .findOtherCurrentPrimaryCareers(studentId, excludedId);
        for (StudentAcademicCareer otherPrimaryCareer : otherPrimaryCareers) {
            otherPrimaryCareer.setPrimaryCareer(false);
        }
    }

    private Map<Long, List<AcademicCareerRegistrationDivisionResponse>> findRegistrationDivisionsByCareerId(
            List<Long> academicCareerIds
    ) {
        if (academicCareerIds == null || academicCareerIds.isEmpty()) {
            return Map.of();
        }

        return registrationDivisionRepository
                .findAllForAcademicCareers(academicCareerIds)
                .stream()
                .collect(Collectors.groupingBy(
                        registrationDivision -> registrationDivision.getAcademicCareer().getId(),
                        Collectors.mapping(this::toRegistrationDivisionResponse, Collectors.toList())
                ));
    }

    private List<AcademicCareerRegistrationDivisionResponse> findRegistrationDivisions(Long academicCareerId) {
        return registrationDivisionRepository
                .findAllForAcademicCareer(academicCareerId)
                .stream()
                .map(this::toRegistrationDivisionResponse)
                .toList();
    }

    private AcademicCareerRegistrationDivisionResponse toRegistrationDivisionResponse(
            AcademicCareerRegistrationDivision registrationDivision
    ) {
        AcademicDivision academicDivision = registrationDivision.getAcademicDivision();
        return new AcademicCareerRegistrationDivisionResponse(
                academicDivision.getId(),
                academicDivision.getCode(),
                academicDivision.getName()
        );
    }

    private StudentAcademicCareerResponse toResponse(
            StudentAcademicCareer studentAcademicCareer,
            List<AcademicCareerRegistrationDivisionResponse> registrationDivisions
    ) {
        AcademicCareer academicCareer = studentAcademicCareer.getAcademicCareer();
        Student student = studentAcademicCareer.getStudent();
        SisUser createdByUser = studentAcademicCareer.getCreatedByUser();
        SisUser updatedByUser = studentAcademicCareer.getUpdatedByUser();

        return new StudentAcademicCareerResponse(
                studentAcademicCareer.getId(),
                student == null ? null : student.getId(),
                academicCareer == null ? null : academicCareer.getId(),
                academicCareer == null ? null : academicCareer.getCode(),
                academicCareer == null ? null : academicCareer.getName(),
                studentAcademicCareer.getStatus(),
                studentAcademicCareer.getEffectiveStartDate(),
                studentAcademicCareer.getEffectiveEndDate(),
                studentAcademicCareer.isPrimaryCareer(),
                studentAcademicCareer.getEntryReason(),
                studentAcademicCareer.getNotes(),
                registrationDivisions == null ? List.of() : registrationDivisions,
                createdByUser == null ? null : createdByUser.getId(),
                createdByUser == null ? null : createdByUser.getEmail(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail(),
                studentAcademicCareer.getCreatedAt(),
                studentAcademicCareer.getUpdatedAt()
        );
    }
}
