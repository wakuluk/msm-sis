package com.msm.sis.api.service.billing;

import com.msm.sis.api.dto.billing.CreateTuitionCodeRequest;
import com.msm.sis.api.dto.billing.PatchTuitionCodeRequest;
import com.msm.sis.api.dto.billing.StudentBillingAssignmentResponse;
import com.msm.sis.api.dto.billing.TuitionCodeDetailResponse;
import com.msm.sis.api.dto.billing.TuitionCodeSearchResponse;
import com.msm.sis.api.dto.billing.TuitionCodeSearchResultResponse;
import com.msm.sis.api.dto.billing.UpdateStudentBillingAssignmentRequest;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentTuitionCodeAssignment;
import com.msm.sis.api.entity.TuitionCode;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentRepository;
import com.msm.sis.api.repository.StudentTuitionCodeAssignmentRepository;
import com.msm.sis.api.repository.TuitionCodeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Objects;

import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
public class BillingService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final String TUITION_CODE_PATTERN = "^[A-Z0-9_]+$";

    private final TuitionCodeRepository tuitionCodeRepository;
    private final StudentTuitionCodeAssignmentRepository studentTuitionCodeAssignmentRepository;
    private final StudentRepository studentRepository;
    private final SisUserRepository sisUserRepository;

    public BillingService(
            TuitionCodeRepository tuitionCodeRepository,
            StudentTuitionCodeAssignmentRepository studentTuitionCodeAssignmentRepository,
            StudentRepository studentRepository,
            SisUserRepository sisUserRepository
    ) {
        this.tuitionCodeRepository = tuitionCodeRepository;
        this.studentTuitionCodeAssignmentRepository = studentTuitionCodeAssignmentRepository;
        this.studentRepository = studentRepository;
        this.sisUserRepository = sisUserRepository;
    }

    @Transactional(readOnly = true)
    public TuitionCodeSearchResponse searchTuitionCodes(
            String code,
            String name,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        validatePageRequest(page, size, MAX_PAGE_SIZE);

        Page<TuitionCode> tuitionCodePage = tuitionCodeRepository.searchTuitionCodes(
                toLikePattern(code),
                toLikePattern(name),
                PageRequest.of(page, size, buildTuitionCodeSort(sortBy, sortDirection))
        );

        return new TuitionCodeSearchResponse(
                tuitionCodePage.getContent().stream()
                        .map(this::toSearchResultResponse)
                        .toList(),
                tuitionCodePage.getNumber(),
                tuitionCodePage.getSize(),
                tuitionCodePage.getTotalElements(),
                tuitionCodePage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public TuitionCodeDetailResponse getTuitionCodeDetail(Long tuitionCodeId) {
        return toDetailResponse(getTuitionCodeEntity(tuitionCodeId));
    }

    @Transactional
    public TuitionCodeDetailResponse createTuitionCode(
            CreateTuitionCodeRequest request,
            Long createdByUserId
    ) {
        requireRequestBody(request);

        String code = normalizeCode(request.code());
        String name = trimToNull(request.name());

        validateTuitionCodeFields(code, name);

        if (tuitionCodeRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tuition code already exists.");
        }

        SisUser createdByUser = resolveUser(createdByUserId);

        TuitionCode tuitionCode = new TuitionCode();
        tuitionCode.setCode(code);
        tuitionCode.setName(name);
        tuitionCode.setCreatedByUser(createdByUser);
        tuitionCode.setUpdatedByUser(createdByUser);

        return toDetailResponse(tuitionCodeRepository.save(tuitionCode));
    }

    @Transactional
    public TuitionCodeDetailResponse updateTuitionCode(
            Long tuitionCodeId,
            PatchTuitionCodeRequest request,
            Long updatedByUserId
    ) {
        requireRequestBody(request);

        TuitionCode existingTuitionCode = getTuitionCodeEntity(tuitionCodeId);
        TuitionCode candidateTuitionCode = copyTuitionCode(existingTuitionCode);

        applyTrimmed(request.getCode(), candidateTuitionCode::setCode);
        applyTrimmed(request.getName(), candidateTuitionCode::setName);
        candidateTuitionCode.setCode(normalizeCode(candidateTuitionCode.getCode()));

        validateTuitionCodeFields(candidateTuitionCode.getCode(), candidateTuitionCode.getName());

        if (!Objects.equals(existingTuitionCode.getCode(), candidateTuitionCode.getCode())
                && tuitionCodeRepository.existsByCodeIgnoreCaseAndIdNot(
                        candidateTuitionCode.getCode(),
                        existingTuitionCode.getId()
                )) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tuition code already exists.");
        }

        if (!hasTuitionCodeChanges(existingTuitionCode, candidateTuitionCode)) {
            return toDetailResponse(existingTuitionCode);
        }

        existingTuitionCode.setCode(candidateTuitionCode.getCode());
        existingTuitionCode.setName(candidateTuitionCode.getName());
        existingTuitionCode.setUpdatedByUser(resolveUser(updatedByUserId));

        return toDetailResponse(tuitionCodeRepository.save(existingTuitionCode));
    }

    @Transactional(readOnly = true)
    public StudentBillingAssignmentResponse getStudentBillingAssignment(Long studentId) {
        requirePositiveId(studentId, "Student ID");
        ensureStudentExists(studentId);

        return studentTuitionCodeAssignmentRepository.findByStudent_Id(studentId)
                .map(this::toStudentBillingAssignmentResponse)
                .orElseGet(() -> new StudentBillingAssignmentResponse(
                        studentId,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                ));
    }

    @Transactional
    public StudentBillingAssignmentResponse updateStudentBillingAssignment(
            Long studentId,
            UpdateStudentBillingAssignmentRequest request,
            Long updatedByUserId
    ) {
        requirePositiveId(studentId, "Student ID");
        requireRequestBody(request);

        if (request.tuitionCodeId() == null) {
            return clearStudentTuitionCodeAssignment(studentId);
        }

        Student student = getStudentEntity(studentId);
        TuitionCode tuitionCode = getTuitionCodeEntity(request.tuitionCodeId());
        SisUser updatedByUser = resolveUser(updatedByUserId);

        StudentTuitionCodeAssignment assignment = studentTuitionCodeAssignmentRepository
                .findByStudent_Id(studentId)
                .orElseGet(() -> {
                    StudentTuitionCodeAssignment newAssignment = new StudentTuitionCodeAssignment();
                    newAssignment.setStudent(student);
                    newAssignment.setCreatedByUser(updatedByUser);
                    return newAssignment;
                });

        assignment.setTuitionCode(tuitionCode);
        assignment.setUpdatedByUser(updatedByUser);

        return toStudentBillingAssignmentResponse(
                studentTuitionCodeAssignmentRepository.save(assignment)
        );
    }

    @Transactional
    public StudentBillingAssignmentResponse clearStudentTuitionCodeAssignment(Long studentId) {
        requirePositiveId(studentId, "Student ID");
        ensureStudentExists(studentId);

        studentTuitionCodeAssignmentRepository.findByStudent_Id(studentId)
                .ifPresent(studentTuitionCodeAssignmentRepository::delete);

        return new StudentBillingAssignmentResponse(
                studentId,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    private TuitionCode getTuitionCodeEntity(Long tuitionCodeId) {
        requirePositiveId(tuitionCodeId, "Tuition code ID");

        return tuitionCodeRepository.findById(tuitionCodeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private Student getStudentEntity(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private void ensureStudentExists(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    private SisUser resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }

        return sisUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found."));
    }

    private void validateTuitionCodeFields(String code, String name) {
        if (code == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tuition code is required.");
        }

        if (name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tuition code name is required.");
        }

        validateMaxLength(code, 32, "Tuition code");
        validateMaxLength(name, 255, "Tuition code name");

        if (!code.matches(TUITION_CODE_PATTERN)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tuition code may only contain letters, numbers, and underscores."
            );
        }
    }

    private Sort buildTuitionCodeSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String sortProperty = switch (normalizeSortBy(sortBy, "code")) {
            case "code" -> "code";
            case "name" -> "name";
            case "createdAt" -> "createdAt";
            case "updatedAt" -> "updatedAt";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: code, name, createdAt, updatedAt."
            );
        };

        return Sort.by(direction, sortProperty)
                .and(Sort.by(Sort.Direction.ASC, "code"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private String normalizeCode(String code) {
        String trimmedCode = trimToNull(code);
        return trimmedCode == null ? null : trimmedCode.replaceAll("\\s+", "_").toUpperCase(Locale.US);
    }

    private String toLikePattern(String value) {
        String trimmedValue = trimToNull(value);
        return trimmedValue == null ? null : "%" + trimmedValue.toLowerCase(Locale.US) + "%";
    }

    private TuitionCode copyTuitionCode(TuitionCode tuitionCode) {
        TuitionCode copy = new TuitionCode();
        copy.setId(tuitionCode.getId());
        copy.setCode(tuitionCode.getCode());
        copy.setName(tuitionCode.getName());
        return copy;
    }

    private boolean hasTuitionCodeChanges(TuitionCode existing, TuitionCode candidate) {
        return !Objects.equals(existing.getCode(), candidate.getCode())
                || !Objects.equals(trimToNull(existing.getName()), trimToNull(candidate.getName()));
    }

    private TuitionCodeSearchResultResponse toSearchResultResponse(TuitionCode tuitionCode) {
        return new TuitionCodeSearchResultResponse(
                tuitionCode.getId(),
                tuitionCode.getCode(),
                tuitionCode.getName(),
                tuitionCode.getCreatedAt(),
                tuitionCode.getUpdatedAt()
        );
    }

    private TuitionCodeDetailResponse toDetailResponse(TuitionCode tuitionCode) {
        SisUser createdByUser = tuitionCode.getCreatedByUser();
        SisUser updatedByUser = tuitionCode.getUpdatedByUser();

        return new TuitionCodeDetailResponse(
                tuitionCode.getId(),
                tuitionCode.getCode(),
                tuitionCode.getName(),
                createdByUser == null ? null : createdByUser.getId(),
                createdByUser == null ? null : createdByUser.getEmail(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail(),
                tuitionCode.getCreatedAt(),
                tuitionCode.getUpdatedAt()
        );
    }

    private StudentBillingAssignmentResponse toStudentBillingAssignmentResponse(
            StudentTuitionCodeAssignment assignment
    ) {
        TuitionCode tuitionCode = assignment.getTuitionCode();
        SisUser createdByUser = assignment.getCreatedByUser();
        SisUser updatedByUser = assignment.getUpdatedByUser();

        return new StudentBillingAssignmentResponse(
                assignment.getStudent().getId(),
                assignment.getId(),
                tuitionCode == null ? null : tuitionCode.getId(),
                tuitionCode == null ? null : tuitionCode.getCode(),
                tuitionCode == null ? null : tuitionCode.getName(),
                createdByUser == null ? null : createdByUser.getId(),
                createdByUser == null ? null : createdByUser.getEmail(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt()
        );
    }
}
